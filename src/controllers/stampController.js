const prisma = require('../../config/prisma')

module.exports.getUserStamps = async (req, res) => {
  try {
    const userId = req.userId
    const { period } = req.query

    const stampBoard = await prisma.stampBoard.findFirst({
      where: { 
        userId,
        ...(period && { period: period }), 
        endDate: { gte: new Date() }
      },
      include: { 
        stamps: {
          include: { 
            tasks: true 
          }
        }
      }
    })

    res.json(stampBoard?.stamps || [])
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error fetching stamps' })
  }
}