const request = require('request');
const cheerio = require('cheerio');
const querystring = require('querystring');
const url = require('url');
const express = require('express');
const app = express();

let year;
app.get('/api', (req, res) => {
  const query = url.parse(req.url).query;
  const params = querystring.parse(query);
  if(typeof params.year === 'undefined') {
    year = new Date().getFullYear;
  } else {
    year = params.year;
  }

  request('https://www.tanggalan.com/' + year, (error, response, html) => {
    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(html);
      const data = [];

      if(params.month){
        $('article ul').eq(params.month - 1).each((i, ul) => {
          const $ul = $(ul);
          const Tahun = $ul.find('li b').eq(0).text();
          const strBulan = $ul.find('li a').eq(0).text();
          const cleanedStr = strBulan.replace(/\d+/g, '');
  
          const mapBulan = {
            'januari': '01',
            'februari': '02',
            'maret': '03',
            'april': '04',
            'mei': '05',
            'juni': '06',
            'juli': '07',
            'agustus': '08',
            'september': '09',
            'oktober': '10',
            'november': '11',
            'desember': '12'
          }
  
          const Bulan = cleanedStr.toLowerCase().trim();
          const kodeBulan = mapBulan[Bulan];
  
          $ul.find('li').eq(3).find('tbody tr').each((i, tr) => {
            const $tr = $(tr);
            const namaHariLibur = $tr.find('td').eq(1).text();
            const tanggal = $tr.find('td').eq(0).text();
            if (tanggal.includes('-')) {
              const date = tanggal.split('-');
              const start = parseInt(date[0]);
              const end = parseInt(date[1]);
  
              for (let i = start; i <= end; i++) {
                data.push({ tanggal: Tahun + '-' + kodeBulan + '-' + i.toString(), keterangan: namaHariLibur })
              }
            } else {
              data.push({ tanggal: Tahun + '-' + kodeBulan + '-' + tanggal, keterangan: namaHariLibur });
            }
          })
        })
      }
      res.json(data) // Mengirim file HTML sebagai response
    } else {
      console.log(error);
    }
  });
}); 

app.listen(3000, () => {
  console.log('Website berjalan pada port 3000!');
});
