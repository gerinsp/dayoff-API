const request = require("request");
const cheerio = require("cheerio");
const fs = require("fs");
const querystring = require("querystring");
const url = require("url");
const express = require("express");
const scraper = require("./services/scraper");
const schedule = require("node-schedule");
const app = express();

app.use(express.static("./public"));

// scraper(cheerio, request, fs, schedule);

app.get("/api", (req, res) => {
  const query = url.parse(req.url).query;
  const params = querystring.parse(query);
  let year;

  if (typeof params.year === "undefined") {
    year = new Date().getFullYear();
  } else {
    year = params.year;
  }

  const directoryPath = "data";
  const files = fs.readdirSync(directoryPath);
  const filename = files.find((file) => file.includes(year));

  if (filename) {
    const rawData = fs.readFileSync(`${directoryPath}/${filename}`)
    const data = JSON.parse(rawData);
    if(params.month) {
      console.log('month')
      const filterData = data.filter((item => {
        const tanggal =  new Date(item.tanggal)
        const monthNum = tanggal.getMonth() + 1
        return monthNum == params.month
      }))
      res.json(filterData)
    } else {
      console.log('data dari file json')
      res.json(data);
    }

  } else {
    scrapingData(year, params, res);
  }
});

app.get("/", (req, res) => {
  res.sendFile("index.html");
});

app.get("/api/now", (req, res) => {
  const query = url.parse(req.url).query;
  const params = querystring.parse(query);
  let year;

  if (typeof params.year === "undefined") {
    year = new Date().getFullYear();
  } else {
    year = params.year;
  }

  scrapingData(year, params, res)
})

function scrapingData(year, params, res) {
  request("https://www.tanggalan.com/" + year, (error, response, html) => {
    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(html);
      const data = [];

      if (params.month) {
        $("article ul")
          .eq(params.month - 1)
          .each((i, ul) => {
            const $ul = $(ul);
            const Tahun = $ul.find("li b").eq(0).text();
            const strBulan = $ul.find("li a").eq(0).text();
            const cleanedStr = strBulan.replace(/\d+/g, "");

            const mapBulan = {
              januari: "01",
              februari: "02",
              maret: "03",
              april: "04",
              mei: "05",
              juni: "06",
              juli: "07",
              agustus: "08",
              september: "09",
              oktober: "10",
              november: "11",
              desember: "12",
            };

            const Bulan = cleanedStr.toLowerCase().trim();
            const kodeBulan = mapBulan[Bulan];

            $ul
              .find("li")
              .eq(3)
              .find("tbody tr")
              .each((i, tr) => {
                const $tr = $(tr);
                const namaHariLibur = $tr.find("td").eq(1).text();
                const tanggal = $tr.find("td").eq(0).text();
                if (tanggal.includes("-")) {
                  const date = tanggal.split("-");
                  const start = parseInt(date[0]);
                  const end = parseInt(date[1]);

                  for (let i = start; i <= end; i++) {
                    data.push({
                      tanggal: Tahun + "-" + kodeBulan + "-" + i.toString(),
                      keterangan: namaHariLibur,
                    });
                  }
                } else {
                  data.push({
                    tanggal: Tahun + "-" + kodeBulan + "-" + tanggal,
                    keterangan: namaHariLibur,
                  });
                }
              });
          });
      } else {
        $("article ul").each((i, ul) => {
          const $ul = $(ul);
          const Tahun = $ul.find("li b").eq(0).text();
          const strBulan = $ul.find("li a").eq(0).text();
          const cleanedStr = strBulan.replace(/\d+/g, "");

          const mapBulan = {
            januari: "01",
            februari: "02",
            maret: "03",
            april: "04",
            mei: "05",
            juni: "06",
            juli: "07",
            agustus: "08",
            september: "09",
            oktober: "10",
            november: "11",
            desember: "12",
          };

          const Bulan = cleanedStr.toLowerCase().trim();
          const kodeBulan = mapBulan[Bulan];

          $ul
            .find("li")
            .eq(3)
            .find("tbody tr")
            .each((i, tr) => {
              const $tr = $(tr);
              const namaHariLibur = $tr.find("td").eq(1).text();
              const tanggal = $tr.find("td").eq(0).text();
              if (tanggal.includes("-")) {
                const date = tanggal.split("-");
                const start = parseInt(date[0]);
                const end = parseInt(date[1]);

                for (let i = start; i <= end; i++) {
                  data.push({
                    tanggal: Tahun + "-" + kodeBulan + "-" + i.toString(),
                    keterangan: namaHariLibur,
                  });
                }
              } else {
                data.push({
                  tanggal: Tahun + "-" + kodeBulan + "-" + tanggal,
                  keterangan: namaHariLibur,
                });
              }
            });
        });
      }
      res.json(data); // Mengirim file HTML sebagai response
    } else {
      console.log(error);
    }
  });
}

app.listen(3000, () => {
  console.log("Website berjalan pada port 3000!");
});
