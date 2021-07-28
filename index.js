const express = require('express');
const fetch = require('node-fetch');
const cloudscraper = require('cloudscraper').defaults({
    agentOptions: {
      ciphers: 'AES256-SHA'
    }
  });
const CryptoJS = require("crypto-js");
const expressions = require("angular-expressions");
const chunk = require('lodash.chunk');
const mime = require("mime-types");

const app = express();

app.use(express.json());

app.engine("mustache", require('mustache-express')());
app.set('view engine', 'mustache');
app.set('views', __dirname);

app.listen(5190);

app.get(/\/chapter\/park\/(.*)[^c][^h][^a][^p][^t][^e][^r][^s]$/i, async (req, res) => {
  let param = req.path.match(/\/chapter\/park\/(.*)/i)[1];
  let error = false;
  const data = await cloudscraper.get(`https://v2.mangapark.net/manga/${param}`).then(data => {
    if (data.startsWith('No chapter id found')) error = true;
    return data;
  }, err => {
    console.error(err.response);
    error = true;
  });
  if (error) return res.status(404).send("An error has occured. Perhaps the chapter you are looking for doesn't exist");
  const _load_pages = data.match(/var _load_pages = (\[.*?\])/i);
  if (!_load_pages) return res.status(404).send("An error has occured. Perhaps the chapter you are looking for doesn't exist");
  let images = JSON.parse(_load_pages[1]);
  const mangaName = data.match(/var _manga_name = '(.*?)';/i)[1];
  let prevEpi = data.match(/var _prev_link = '(.*?)';/i)[1].replace('manga', 'chapter/park');
  let nextEpi = data.match(/var _next_link = '(.*?)';/i)[1].replace('manga', 'chapter/park');
  if ((prevEpi.match(/\//g)||[]).length-(nextEpi.match(/\//g)||[]).length < 0) prevEpi = '#';
  if ((nextEpi.match(/\//g)||[]).length-(prevEpi.match(/\//g)||[]).length < 0) nextEpi = '#';
  const { 1: seriesName, 2: title } = data.match(/<span class="loc">.*?<a href="\/manga\/.*?">(.*?) Manga<\/a> \/ (.*?)<em class="refresh".*?><\/em><\/span>/i) || [data.match(/<a href="\/manga\/.*?">(.*?) Manga<\/a>/i)[1], data.match(/<meta property="og:title" content="(.*?)" \/>/i)[1]];
  let selector = '<select onchange="selectChapter(this.value)">';
  await fetch('https:'+data.match(/<script( type="text\/javascript")? src="(\/\/v2\.mangapark\.net\/book-list\/.*?)"><\/script>/i)[2]).then(res => res.text()).then(res => {
    JSON.parse(res.match(/var _json_bok = (\[.*?\]);/i)[1]).forEach(e => {
      e.l.forEach(e => {
        selector += `<option value="${e.l}"${param.endsWith(e.l) ? 'selected' : ''}>${e.t}</option>`;
      })
    });
    selector += '</select>';
  });
  let imagestring = '';
  let imageslength = images.length;
  let imageschunk = chunk(images, req.query.l||16);
  if (req.query.p) images = imageschunk[req.query.p-1];
  if (!images) return res.status(404).send("An error has occured. Perhaps the chapter you are looking for doesn't exist");
  if (req.query.p) {
    if (req.query.p < imageschunk.length) nextEpi = `${req.path}?${new URLSearchParams({ ...req.query, p: Number(req.query.p)+1 }).toString()}`;
    else nextEpi += `?${new URLSearchParams({ ...req.query, p: 1 }).toString()}`;
    if (req.query.p > 1) prevEpi = `${req.path}?${new URLSearchParams({ ...req.query, p: Number(req.query.p)-1 }).toString()}`;
    else prevEpi += `?${new URLSearchParams({ ...req.query, p: 1 }).toString()}`;
  }
  for (const i of images) {
    imagestring += `<img src="/getImage/${i.u}">`;
  }
  return res.render('index', { chapter: 'park/'+param, images: imagestring, title: title, seriesName: seriesName, prevEpi: prevEpi, nextEpi: nextEpi, selector: selector, urlthing: `park/${mangaName}`, imageslength: imageslength||100, splitlength: req.query.l||16, splitchecked: req.query.p ? ' checked' : '', count: req.query.p ? `${req.query.p}/${imageschunk.length}` : '' });
});
app.get(/\/chapter\/park\/(.*)\/chapters/i, async (req, res) => {
  let param = req.path.match(/\/chapter\/park\/(.*)\/chapters/i)[1];
  let error = false;
  const data = await cloudscraper.get(`https://v2.mangapark.net/manga/${param}`).then(data => {
    if (data.startsWith('No chapter id found')) error = true;
    return data;
  }, err => {
    console.error(err.response);
    error = true;
  });
  if (error) return res.status(404).send("An error has occured. Perhaps the chapter you are looking for doesn't exist");
  if (!data.match(/var _load_pages = (\[.*?\])/i)) return res.status(404).send("An error has occured. Perhaps the chapter you are looking for doesn't exist");
  const mangaName = data.match(/var _manga_name = '(.*?)';/i)[1];
  const { 1: seriesName, 2: title } = data.match(/<span class="loc">.*?<a href="\/manga\/.*?">(.*?) Manga<\/a> \/ (.*?)<em class="refresh".*?><\/em><\/span>/i) || [data.match(/<a href="\/manga\/.*?">(.*?) Manga<\/a>/i)[1], data.match(/<meta property="og:title" content="(.*?)" \/>/i)[1]];
  let selector = '';
  await fetch('https:'+data.match(/<script( type="text\/javascript")? src="(\/\/v2\.mangapark\.net\/book-list\/.*?)"><\/script>/i)[2]).then(res => res.text()).then(res => {
    JSON.parse(res.match(/var _json_bok = (\[.*?\]);/i)[1]).forEach(e => {
      e.l.forEach(e => {
        let ends = param.endsWith(e.l);
        selector += `<a href="/chapter/park/${mangaName}${e.l}"${ends ? ' style="font-weight: 900;"' : ''}>${e.t}</a><br>`;
      })
    });
  });
  return res.render('chapters', { title: title, seriesName: seriesName, selector: selector });
});

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
  const batojs = expressions.compile(data.match(/const batojs = (\[.*\])/i)[1])();
  const server = JSON.parse(CryptoJS.AES.decrypt(rawServer, batojs).toString(CryptoJS.enc.Utf8));
  let images = JSON.parse(data.match(/const images = (\[.*?\])/i)[1]);
  let prevEpi = JSON.parse((data.match(/const prevEpi = ({.*?})/i) || ['','{"iid":"#"}'])[1]).iid;
  let nextEpi = JSON.parse((data.match(/const nextEpi = ({.*?})/i) || ['','{"iid":"#"}'])[1]).iid;
  const seriesName = data.match(/<a href="\/series\/.*?">(.*?)<\/a>/i)[1];
  const title = data.match(new RegExp(`<option value="${req.params.chapter}">(.*?)<\/option>`, 'is'))[1].replace(/\s+/g, ' ');
  const selector = data.match(/<select.*?>\s*?<optgroup label="Chapters">\s*?(<option value=".*?">.*?<\/option>)+\s*?<\/optgroup>\s*?<\/select>/s)[0]
      .replace(new RegExp(`(?<=<option value="${req.params.chapter}")()(?=>)`, 'i'), ' selected="selected"')
      .replace(/(?<=<select.*?)()(?=>)/i, ' onchange="selectChapter(this.value)"');
  let imagestring = '';
  let imageslength = images.length;
  let imageschunk = chunk(images, req.query.l||16);
  if (req.query.p) images = imageschunk[req.query.p-1];
  if (!images) return res.status(404).send("An error has occured. Perhaps the chapter you are looking for doesn't exist");
  if (req.query.p) {
    if (req.query.p < imageschunk.length) nextEpi = `${req.path}?${new URLSearchParams({ ...req.query, p: Number(req.query.p)+1 }).toString()}`;
    else if (nextEpi !== '#') nextEpi += `?${new URLSearchParams({ ...req.query, p: 1 }).toString()}`;
    if (req.query.p > 1) prevEpi = `${req.path}?${new URLSearchParams({ ...req.query, p: Number(req.query.p)-1 }).toString()}`;
    else if (prevEpi !== '#') prevEpi += `?${new URLSearchParams({ ...req.query, p: 1 }).toString()}`;
  }
  images.forEach(i => {
      imagestring += `<img src="${server}${i}">`;
  });
  return res.render('index', { chapter: req.params.chapter, images: imagestring, title: title, seriesName: seriesName, prevEpi: prevEpi, nextEpi: nextEpi, selector: selector, imageslength: imageslength||100, splitlength: req.query.l||16, splitchecked: req.query.p ? ' checked' : '', count: req.query.p ? `${req.query.p}/${imageschunk.length}` : '' });
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

app.get('/getImage/*', async (req, res) => {
  const url = `${req.params[0]}?${new URLSearchParams({ ...req.query }).toString()}`;
  const image = await cloudscraper({
    method: 'GET',
    url: url,
    encoding: null
  }).then(data => {
    return data;
  }, err => {
    console.error(err.response);
    return url;
  });
  res.set("Content-Type", mime.lookup(req.params[0]) || 'image/webp');
  res.send(image);
});

console.log('Hosting manga on :5190!');