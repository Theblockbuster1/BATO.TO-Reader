const express = require('express');
const cloudscraper = require('cloudscraper').defaults({
    agentOptions: {
      ciphers: 'AES256-SHA'
    }
  });
const CryptoJS = require("crypto-js");

const app = express();

app.use(express.json());

app.engine("mustache", require('mustache-express')());
app.set('view engine', 'mustache');
app.set('views', __dirname);

app.listen(5190);

app.get('/chapter/:chapter', async (req, res) => {
  let error = false;
  const data = await cloudscraper.get(`https://bato.to/chapter/${req.params.chapter}`).then(data => {
    if (data.startsWith('404')) error = true;
    return data;
  }, err => {
    console.error(err.response);
    error = true;
  });
  if (error) return res.status(404).send("An error has occured. Perhaps the chapter you are looking for doesn't exist");
  const rawServer = data.match(/const server = "(.*?)"/i)[1];
  const batojs = eval(data.match(/const batojs = (\[.*\])/i)[1]);
  const server = JSON.parse(CryptoJS.AES.decrypt(rawServer, batojs).toString(CryptoJS.enc.Utf8));
  const images = JSON.parse(data.match(/const images = (\[.*?\])/i)[1]);
  const prevEpi = JSON.parse((data.match(/const prevEpi = ({.*?})/i) || ['','{"iid":"#"}'])[1]).iid;
  const nextEpi = JSON.parse((data.match(/const nextEpi = ({.*?})/i) || ['','{"iid":"#"}'])[1]).iid;
  const seriesName = data.match(/<a href="\/series\/.*?">(.*?)<\/a>/i)[1];
  const title = data.match(new RegExp(`<option value="${req.params.chapter}">(.*?)<\/option>`, 'is'))[1].replace(/\s+/g, ' ');
  const selector = data.match(/<select.*?>\s*?<optgroup label="Chapters">\s*?(<option value=".*?">.*?<\/option>)+\s*?<\/optgroup>\s*?<\/select>/s)[0]
      .replace(new RegExp(`(?<=<option value="${req.params.chapter}")()(?=>)`, 'i'), ' selected="selected"')
      .replace(/(?<=<select.*?)()(?=>)/i, ' onchange="selectChapter(this)"');
  let imagestring = '';
  images.forEach(i => {
      imagestring += `<img src="${server}${i}">`;
  });
  return res.render('index', { chapter: req.params.chapter, images: imagestring, title: title, seriesName: seriesName, prevEpi: prevEpi, nextEpi: nextEpi, selector: selector });
});
app.get('/chapter/:chapter/chapters', async (req, res) => {
  let error = false;
  const data = await cloudscraper.get(`https://bato.to/chapter/${req.params.chapter}`).then(data => {
    if (data.startsWith('404')) error = true;
    return data;
  }, err => {
    console.error(err.response);
    error = true;
  });
  if (error) return res.status(404).send("An error has occured. Perhaps the chapter you are looking for doesn't exist");
  const seriesName = data.match(/<a href="\/series\/.*?">(.*?)<\/a>/i)[1];
  const title = data.match(new RegExp(`<option value="${req.params.chapter}">(.*?)<\/option>`, 'is'))[1].replace(/\s+/g, ' ');
  const selector = data.match(/<select.*?>\s*?<optgroup label="Chapters">\s*?(<option value=".*?">.*?<\/option>)+\s*?<\/optgroup>\s*?<\/select>/s)[1]
      .replace(new RegExp(`<option value="${req.params.chapter}">(.*?)<\/option>`, 'is'), (_,m) => { return `<option value="${req.params.chapter}" style="font-weight: 900;">${m}<\/option>` })
      .replace(/(?<=<option value="(.*?)")()(?=>)/gi, (_,m) => { return `href="/chapter/${m}"` })
      .replace(/(?<!\w)option(?!\w)/gi, 'a')
      .replace(/(?<=<\/a>)/gi, '<br>');
  return res.render('chapters', { title: title, seriesName: seriesName, selector: selector });
});

console.log('Hosting manga on :5190!');