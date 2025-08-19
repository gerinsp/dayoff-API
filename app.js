const request = require("request");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");
const querystring = require("querystring");
const url = require("url");
const express = require("express");
const scraper = require("./services/scraper");
const schedule = require("node-schedule");
const { promisify } = require("util");
const readdirAsync = promisify(fs.readdir);
const readFileAsync = promisify(fs.readFile);
const app = express();

app.use(express.static("./public"));

app.get("/api", async (req, res) => {
  const query = url.parse(req.url).query;
  const params = querystring.parse(query);
  let year;

  if (typeof params.year === "undefined") {
    year = new Date().getFullYear();
  } else {
    year = params.year;
  }
  try {
    const files = await readdirAsync(path.join(__dirname, "data"));
    const filename = files.find((file) => file.includes(year));

    const options = { 
      weekday: 'long',   // nama hari
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      timeZone: 'Asia/Jakarta'
    };

    if (filename) {
      const rawData = await readFileAsync(
        path.join(__dirname, "data", `${year}.json`)
      );
      let data = JSON.parse(rawData);
      data.forEach((item) => {
        if (item.keterangan.toLowerCase().includes("cuti bersama")) {
          item.is_cuti = true;
        } else {
          item.is_cuti = false;
        }
      });
      if (params.month) {
        console.log("month");
        const filterData = data
        .filter((item) => {
          const tanggal = new Date(item.tanggal);
          const monthNum = tanggal.getMonth() + 1;
          return monthNum == params.month;
        })
        .map(item =>{
          const tanggal = new Date(item.tanggal);
          return {
            tanggal: item.tanggal,
            tanggal_display: tanggal.toLocaleDateString('id-ID', options),
            keterangan: item.keterangan,
            is_cuti: item.is_cuti
          }
        });
        res.json(filterData);
      } else {
        console.log("data dari file json");
        data = data.map(item => {
          const tanggal = new Date(item.tanggal);
          return {
            tanggal: item.tanggal,
            tanggal_display: tanggal.toLocaleDateString('id-ID', options),
            keterangan: item.keterangan,
            is_cuti: item.is_cuti
          }
        })
        res.json(data);
      }
    } else {
      res.status(404).json({
        message: "Data tidak tersedia.",
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error.",
    });
  }
});

app.get("/api/get-data", async (req, res) => {
  try {
    const data = await scraper(cheerio, request, fs, schedule); // Langsung dapatkan data JSON
    res.json({
      status: 'OK',
      message: 'Success melakukan scraping data',
      data: data // Kirim data JSON langsung
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Terjadi kesalahan saat melakukan scraping data',
    });
  }
});

app.get("/", (req, res) => {
  res.sendFile("index.html");
});

app.listen(3000, () => {
  console.log("Website berjalan pada port 3000!");
});
