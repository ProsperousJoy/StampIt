const prisma = require('../../config/prisma')

module.exports.createTask = async (req, res) => {
  try {
    const { title, description } = req.body
    const userId = req.userId

    // Check if user already has 3 TODO tasks
    const todoTasksCount = await prisma.task.count({
      where: { 
        userId, 
        status: 'TODO' 
      }
    })

    if (todoTasksCount >= 3) {
      return res.status(400).json({ message: 'You can only have 3 tasks at a time' })
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        userId,
        status: 'TODO'
      }
    })

    res.status(201).json(task)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error creating task' })
  }
}

module.exports.updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params
    const { status } = req.body
    const userId = req.userId

    const task = await prisma.task.findUnique({
      where: { id: taskId }
    })

    if (!task || task.userId !== userId) {
      return res.status(404).json({ message: 'Task not found' })
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status }
    })

    // Check if user has completed 3 tasks to create a stamp
    const completedTasksCount = await prisma.task.count({
      where: { 
        userId, 
        status: 'COMPLETED' 
      }
    })

    if (completedTasksCount >= 3) {
      // Get the current active stamp board
      const currentBoard = await prisma.stampBoard.findFirst({
        where: { 
          userId,
          endDate: { gte: new Date() }
        }
      })

      if (currentBoard) {
        // Create a new stamp
        const stamp = await prisma.stamp.create({
          data: {
            userId,
            boardId: currentBoard.id,
            design: 'one', // You can randomize this
            quote: "Great job completing your tasks!", // Can be a dynamic quote
            tasks: {
              connect: await prisma.task.findMany({
                where: { 
                  userId, 
                  status: 'COMPLETED' 
                },
                take: 3,
                select: { id: true }
              })
            }
          }
        })

        // Reset completed tasks
        await prisma.task.updateMany({
          where: { 
            userId, 
            status: 'COMPLETED' 
          },
          data: { status: 'TODO' }
        })

        return res.json({ task: updatedTask, stamp })
      }
    }

    res.json(updatedTask)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error updating task' })
  }
}

module.exports.getUserTasks = async (req, res) => {
  try {
    const userId = req.userId

    const tasks = await prisma.task.findMany({
      where: { userId },
      orderBy: { date: 'desc' }
    })

    res.json(tasks)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error fetching tasks' })
  }
}