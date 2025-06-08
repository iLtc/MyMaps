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
        ['China', '1994'],
        ['United States', '2015'],
        ['France', '2013'],
        ['Italy', '2013'],
        ['Switzerland', '2013'],
        ['Canada', '2024']
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
        ['Heilongjiang Sheng', '2019'],
        ['Jilin Sheng', '2019'],
        ['Zhejiang Sheng', '2015'],
        ['Guangdong Sheng', '2012'],
        ['Beijing Shi', '2015'],
        ['Shanghai Shi', '2015'],
        ['HK', '2012'],
        ['Macao SAR', '2012'],
        ['Liaoning Sheng', '2012'],
        ['Sichuan Sheng', '2010'],
        ['Jiangsu Sheng', '2010'],
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

    const allStates = [
        'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
        'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
        'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
        'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
        'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
        'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
        'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
        'Wisconsin', 'Wyoming'
    ];

    const visited = {
        'Iowa': '2015',
        'California': '2015',
        'Illinois': '2016',
        'Connecticut': '2017',
        'Delaware': '2017',
        'Massachusetts': '2017',
        'New Jersey': '2017',
        'New York': '2017',
        'Pennsylvania': '2017',
        'Rhode Island': '2017',
        'Nevada': '2017',
        'Arizona': '2023',
        'Oregon': '2023',
        'Washington': '2023',
        'Alaska': '2025'
    };

    const dataArray = [['State', 'Visited', { type: 'string', role: 'tooltip' }]];
    allStates.forEach(state => {
        if (visited[state]) {
            dataArray.push([state, 1, `Visited: ${visited[state]}`]);
        } else {
            dataArray.push([state, 0, 'Not visited']);
        }
    });

    const data = google.visualization.arrayToDataTable(dataArray);

    const options = {
        region: "US",
        resolution: "provinces",
        colors: ['#F5F5F5', '#267114'],
        legend: 'none'
    };

    const geochart = new google.visualization.GeoChart(
        document.getElementById('us-map'));
    geochart.draw(data, options);
};