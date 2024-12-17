const fs = require('fs')
const Papa = require('papaparse')

module.exports.getRandomQuote = () => {
    return new Promise((resolve, reject) => {
      const csvFilePath = '.../assets/quotes.csv'
      const file = fs.createReadStream(csvFilePath)
      let csvData = []
  
      Papa.parse(file, {
        header: true,
        step: function(result) {
          csvData.push(result.data)
        },
        complete: function() {
          const quotesData = csvData.map(row => row.Quote) // Access Quote field directly
          const randomRow = quotesData[Math.floor(Math.random() * quotesData.length)]
          resolve(randomRow)
        },
        error: function(error) {
          reject(error)
        }
      })
    })
}