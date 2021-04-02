const express = require('express');
const fetch = require('node-fetch');

const app = express();

app.use(express.json());

app.engine("mustache", require('mustache-express')());
app.set('view engine', 'mustache');
app.set('views', __dirname);

app.listen(80);

app.get('/chapter/:chapter', async (req, res) => {
    const data = await fetch(`https://bato.to/chapter/${req.params.chapter}`).then(data => { return data.text() });
    const images = JSON.parse(data.match(/const images = (\[.*?\])/i)[1]);
    const prevEpi = JSON.parse(data.match(/const prevEpi = ({.*?})/i)[1]).iid;
    const nextEpi = JSON.parse(data.match(/const nextEpi = ({.*?})/i)[1]).iid;
    const title = data.match(new RegExp(`<option value="${req.params.chapter}">(.*?)<\/option>`, 'is'))[1].replace(/\s+/g, ' ');
    let imagestring = '';
    images.forEach(i => {
        imagestring += `<img src="https://xcdn-211.bato.to${i}">`;
    });
    res.render('index', { images: imagestring, title: title, prevEpi: prevEpi, nextEpi: nextEpi });
});