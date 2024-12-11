const prisma = require('../../config/prisma')

module.exports.createTask = async (req, res) => {
  try {
    const { title, description } = req.body
    const userId = req.userId

    console.log('Creating task for user:', userId)

    // Check if user already has 3 TODO tasks
    const todoTasksCount = await prisma.task.count({
      where: { 
        userId, 
        status: 'TODO' 
      }
    })

    console.log('Current TODO task count for user', userId, ':', todoTasksCount)

    if (todoTasksCount >= 3) {
      console.log('User already has 3 TODO tasks. Returning error.')
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

    console.log('Task created successfully:', task)

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

    console.log('Updating task status for task:', taskId, 'by user:', userId)

    const task = await prisma.task.findUnique({
      where: { id: taskId }
    })

    if (!task) {
      console.log('Task not found:', taskId)
      return res.status(404).json({ message: 'Task not found' })
    }

    if (task.userId !== userId) {
      console.log('User does not own the task:', userId, 'vs task userId:', task.userId)
      return res.status(404).json({ message: 'Task not found' })
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status }
    })

    console.log('Task status updated:', updatedTask)

    // Check if user has completed 3 tasks to create a stamp
    const completedTasksCount = await prisma.task.count({
      where: { 
        userId, 
        status: 'COMPLETED' 
      }
    })

    console.log('Completed tasks count for user', userId, ':', completedTasksCount)

    if (completedTasksCount >= 3) {
      // Get the current active stamp board
      const currentBoard = await prisma.stampBoard.findFirst({
        where: { 
          userId,
          endDate: { gte: new Date() }
        }
      })

      if (currentBoard) {
        console.log('Found active stamp board:', currentBoard.id)

        // Create a new stamp
        const stamp = await prisma.stamp.create({
          data: {
            userId,
            boardId: currentBoard.id,
            design: 'one',
            quote: "Great job completing your tasks!",
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

        console.log('New stamp created:', stamp)

        // Reset completed tasks
        await prisma.task.updateMany({
          where: { 
            userId, 
            status: 'COMPLETED' 
          },
          data: { status: 'TODO' }
        })

        console.log('Completed tasks reset to TODO')

        return res.json({ task: updatedTask, stamp })
      } else {
        console.log('No active stamp board found for user:', userId)
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

    console.log('Fetching tasks for user:', userId)

    const tasks = await prisma.task.findMany({
      where: { userId },
      orderBy: { date: 'desc' }
    })

    console.log('Fetched tasks:', tasks)

    res.json(tasks)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error fetching tasks' })
  }
}