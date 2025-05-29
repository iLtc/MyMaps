google.charts.load('current', {
    'packages': ['geochart'],
    'mapsApiKey': 'AIzaSyB8-k6b-eg2Y3sQcnfVEMLnjUEwYU74cb4'
});
google.charts.setOnLoadCallback(drawMaps);

function drawMaps() {
    drawWorld();
    drawCN();
    drawUS();
}

let oldWidth = $('#world-map').css('width');

window.onresize = () => {
    const newWidth = $('#world-map').css('width');
    
    if (oldWidth !== newWidth) {
        oldWidth = newWidth;
        drawMaps();
    }
};

const drawWorld = () => {
    $('#world-map').empty();

    const data = google.visualization.arrayToDataTable([
        ['State', { type: 'string', role: 'tooltip' }],
        ['China', '1994 - Present'],
        ['United States', '2015 - 2018 and 2019 - Present'],
        ['France', 'Summer 2013'],
        ['Italy', 'Summer 2013'],
        ['Switzerland', 'Summer 2013'],
        ['Canada', 'June 2024']
    ]);

    const geochart = new google.visualization.GeoChart(
        document.getElementById('world-map'));

    google.visualization.events.addListener(geochart, 'select', () => {
        const selection = geochart.getSelection();

        if (selection.length > 0) {
            const country = data.getValue(selection[0].row, 0);

            if (country === 'China') {
                window.location.hash = 'cn';
            } else if (country === 'United States') {
                window.location.hash = 'us';
            }
        }
    });

    geochart.draw(data);
};

const drawCN = () => {
    $('#cn-map').empty();

    const data = google.visualization.arrayToDataTable([
        ['State', { type: 'string', role: 'tooltip' }],
        ['Heilongjiang Sheng', 'Summer 2019'],
        ['Jilin Sheng', 'Summer 2019'],
        ['Zhejiang Sheng', 'Summer 2015 and Spring 2019'],
        ['Guangdong Sheng', '2012 - 2015, Winter 2018'],
        ['Beijing Shi', 'Summer 2015'],
        ['Shanghai Shi', 'Summer 2015'],
        ['HK', 'Sometime 2012'],
        ['Macao SAR', 'Sometime 2012'],
        ['Liaoning Sheng', 'Summer 2012'],
        ['Sichuan Sheng', 'Summer 2010'],
        ['Jiangsu Sheng', 'March 2010'],
        ['Shanxi Sheng', 'When I was young'],
        ['Yunnan Sheng', 'When I was young'],
        ['Jiangxi Sheng', 'When I was young'],
        ['Hunan Sheng', 'When I was young'],
        ['Hubei Sheng', 'When I was young'],
        ['Chongqing Shi', 'When I was young'],
        ['Anhui Sheng', 'Hometown']
    ]);

    const geochart = new google.visualization.GeoChart(
        document.getElementById('cn-map'));
    geochart.draw(data, { region: "CN", resolution: "provinces" });
};

const drawUS = () => {
    $('#us-map').empty();

    const data = google.visualization.arrayToDataTable([
        ['State', { type: 'string', role: 'tooltip' }],
        ['Iowa', '2015 - 2018'],
        ['Illinois', 'Summer 2016'],
        ['California', 'Thanksgiving Break 2015, Summer 2018, and 2021 - Present'],
        ['Connecticut', 'Summer 2017'],
        ['Delaware', 'Summer 2017'],
        ['Massachusetts', 'Summer 2017'],
        ['New Jersey', 'Summer 2017 and 2019 - 2021'],
        ['New York', 'Summer 2017 and 2019 - 2021'],
        ['Pennsylvania', 'Summer 2017'],
        ['Rhode Island', 'Summer 2017'],
        ['Nevada', 'Spring Break 2017 and September 2023'],
        ['Arizona', 'September 2023'],
        ['Oregon', 'Thanksgiving 2023'],
        ['Washington', 'Thanksgiving 2023']
    ]);

    const geochart = new google.visualization.GeoChart(
        document.getElementById('us-map'));
    geochart.draw(data, { region: "US", resolution: "provinces" });
};