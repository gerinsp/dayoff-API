const path = require("path");

const scraper = (cheerio, request, fs, schedule) => {
  console.log("scraper running..");

  let yearNow = new Date().getFullYear();
  console.log("update data baru " + yearNow);
  return scraperData(yearNow);

  function scraperData(year) {
    return new Promise((resolve, reject) => {
      request("https://www.tanggalan.com/" + year, (error, response, html) => {
        if (!error && response.statusCode == 200) {
          const $ = cheerio.load(html);
          const data = [];

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

          const dataJson = JSON.stringify(data);
          const filename = `${year}.json`;
          const foldername = "data";
          const filePath = path.join(foldername, filename);

          // Pastikan folder ada sebelum menyimpan file
          fs.mkdir(foldername, { recursive: true }, (err) => {
            if (err) return reject(err);

            fs.writeFile(filePath, dataJson, (err) => {
              if (err) return reject(err);
              console.log(`File ${filename} berhasil dibuat`);
            });
          });

          resolve(data); // Kembalikan path file
        } else {
          console.log(error);
          reject(error);
        }
      });
    });
  }
};

module.exports = scraper;
