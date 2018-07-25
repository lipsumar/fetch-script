const Promise = require("bluebird");
const Json2csvParser = require("json2csv").Parser;
const GoogleSpreadsheet = require("google-spreadsheet");
const googleDriveCreds = require("../../gdrive-creds.json");

class Csv {
  constructor(columns) {
    this.columns = columns;
    this.rows = [];
  }

  row() {
    const args = [...arguments];
    if (args.length !== this.columns.length) {
      throw new Error("column length <-> row length mismatch");
    }
    this.rows.push(
      this.columns.reduce((r, col, i) => {
        r[col] = args[i];
        return r;
      }, {})
    );
  }

  format() {
    try {
      const parser = new Json2csvParser({
        fields: this.columns
      });
      const csv = parser.parse(this.rows);
      return csv;
    } catch (err) {
      console.error(err);
    }
  }

  saveToGoogleDrive(sheetKey) {
    console.log('Saving to Google sheet...')
    const doc = new GoogleSpreadsheet(sheetKey);
    return new Promise(resolve => {
      doc.useServiceAccountAuth(googleDriveCreds, err => {
        if (err) throw err;
        doc.getInfo((err, info) => {
          console.log("  Loaded doc: " + info.title + " by " + info.author.email);
          const sheet = info.worksheets[0];
          console.log("  Sheet 1: " + sheet.title + " " + sheet.rowCount + "x" + sheet.colCount);

          const addRow = Promise.promisify(sheet.addRow);

          sheet.setHeaderRow(this.columns, err => {
            if (err) throw err;
            console.log('Writing rows...')
            Promise.resolve(this.rows).mapSeries(row => {
              return addRow(row);
            }).then(() => resolve())
          });
        });
      });
    });
  }
}

const exportVars = {
  createCsv(columns) {
    columns = columns instanceof Array ? columns : columns.split(",");
    return new Csv(columns);
  }
};

module.exports = {
  vars: exportVars
};
