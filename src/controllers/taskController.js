const prisma = require('../../config/prisma')
const { getRandomQuote } = require('../middleware/stampMiddleware')
const stampData = {
  1 : "one",
  2 : "two",
  3 : "three",
  4 : "four",
  5 : "five",
}

module.exports.createTask = async (req, res) => {
  try {
    const { title, description } = req.body
    const userId = req.userId
    const todayStart = new Date()

    console.log('Creating task for user:', userId)

    // Check if user already has 3 tasks created today
    todayStart.setHours(0, 0, 0, 0)

    const tasksCreatedTodayCount = await prisma.task.count({
      where: { 
        userId, 
        date: {
          gte: todayStart
        }
      }
    })

  console.log('Tasks created today for user', userId, ':', tasksCreatedTodayCount)

  if (tasksCreatedTodayCount >= 3) {
    console.log('User has already created 3 tasks today. Returning error.')
    return res.status(400).json({ message: 'You can only create 3 tasks per day' })
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

      // Await random quote
      let randomQuote = await getRandomQuote()

      if (currentBoard) {
        console.log('Found active stamp board:', currentBoard.id)

        // Create a new stamp
        const stamp = await prisma.stamp.create({
          data: {
            userId,
            boardId: currentBoard.id,
            design: stampData[Math.floor(Math.random() * 5) + 1],
            quote: randomQuote,
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

module.exports.editTask = async (req, res) => {
  try {
    const { taskId } = req.params
    const { title, description } = req.body
    const userId = req.userId

    console.log('Editing task:', taskId, 'by user:', userId)

    // Find the task to ensure it exists and belongs to the user
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId }
    })

    if (!existingTask) {
      console.log('Task not found:', taskId)
      return res.status(404).json({ message: 'Task not found' })
    }

    if (existingTask.userId !== userId) {
      console.log('User does not own the task:', userId, 'vs task userId:', existingTask.userId)
      return res.status(403).json({ message: 'Not authorized to edit this task' })
    }

    // Update the task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: title || existingTask.title,
        description: description || existingTask.description
      }
    })

    console.log('Task updated successfully:', updatedTask)

    res.json(updatedTask)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error editing task' })
  }
}

module.exports.deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params
    const userId = req.userId

    console.log('Deleting task:', taskId, 'by user:', userId)

    // Find the task to ensure it exists and belongs to the user
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId }
    })

    if (!existingTask) {
      console.log('Task not found:', taskId)
      return res.status(404).json({ message: 'Task not found' })
    }

    if (existingTask.userId !== userId) {
      console.log('User does not own the task:', userId, 'vs task userId:', existingTask.userId)
      return res.status(403).json({ message: 'Not authorized to delete this task' })
    }

    // Delete the task
    await prisma.task.delete({
      where: { id: taskId }
    })

    console.log('Task deleted successfully:', taskId)

    res.json({ message: 'Task deleted successfully' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error deleting task' })
  }
}