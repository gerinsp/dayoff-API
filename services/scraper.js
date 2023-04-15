const scraper = (cheerio, request, fs, schedule) => {
  console.log("scraper running..");
  const currentYear = 2011;
  // Atur jadwal untuk menjalankan fungsi scraperData() setiap awal tahun
  const job = schedule.scheduleJob("0 0 1 1 *", function () {
    const yearNow = new Date().getFullYear();
    for (let year = currentYear; year <= yearNow; year++) {
      scraperData(year);
    }
  });

  let yearNow = new Date().getFullYear();
  for (let year = currentYear; year <= yearNow; year++) {
    scraperData(year);
  }

  function scraperData(year) {
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
        fs.writeFile(`${foldername}/${filename}`, dataJson, (err) => {
          if (err) throw err;
          console.log("file json berhasil dibuat");
        });
      } else {
        console.log(error);
      }
    });
  }
};

module.exports = scraper;
