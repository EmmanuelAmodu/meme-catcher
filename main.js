const cheerio = require('cheerio');
const axios = require('axios');
const fs = require('fs');

const imageUrls = [];

function getHTML(url) {
  return new Promise((resolve, reject) => {
    axios.get(url)
      .then((response) => resolve(response.data))
      .catch((error) => reject(error))
  });
}

async function fetchMemePage(pages) {
  const promiseArr = [];
  const downloadPromisesArr = [];

  promiseArr.push(getHTML('https://icanhas.cheezburger.com/'));
  for (let i = 1; i < pages; i++) {
    promiseArr.push(getHTML(`https://icanhas.cheezburger.com/page/${i + 1}`));
  }

  const htmls = await Promise.all(promiseArr);

  for (let i = 0; i < htmls.length; i++) {
    fetchMemeImg(htmls[i]);
  }

  for (let i = 0; i < imageUrls.length; i++) {
    downloadPromisesArr.push(downloadFile(imageUrls[i]));
  }

  await Promise.all(downloadPromisesArr);
}

async function downloadFile(fileUrl) {
  const fileName = fileUrl.split('/').pop();
  const writer = fs.createWriteStream(__dirname + '/images/' + fileName + '.png');

  return axios({
    method: 'get',
    url: fileUrl,
    responseType: 'stream',
  }).then(response => {
    return new Promise((resolve, reject) => {
      response.data.pipe(writer);
      let error = null;
      writer.on('error', err => {
        error = err;
        writer.close();
        reject(err);
      });
      writer.on('close', () => {
        if (!error) {
          resolve(true);
        }
      });
    });
  });
}

function fetchMemeImg(html) {
  const $ = cheerio.load(html);
  const arrOfImages = $('div.mu-content-card.mu-card.mu-flush.mu-z1.mu-content-card.js-post[data-post] img');

  for (let i = 0; i < arrOfImages.length; i++) {
    imageUrls.push(arrOfImages[i].attribs['data-src']);
  }
}

fetchMemePage(2);
