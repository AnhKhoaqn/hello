d3.json("/home/data/").then(function(response) {
    if (!Array.isArray(response) || response.length === 0) {
        alert("Không có dữ liệu hợp lệ!");
        return;
    }


    let hourMap = new Map();
    let distinctDates = new Map();

    response.forEach(row => {
        let dateStr = row["Thời gian tạo đơn"];
        let thanhTien = parseFloat(row["Thành tiền"]) || 0;
        
        if (dateStr && thanhTien > 0) {
            let date = new Date(dateStr);
            let hour = date.getHours();
            let formattedHour = `${hour.toString().padStart(2, '0')}:00-${hour.toString().padStart(2, '0')}:59`;
            let dateKey = date.toISOString().split('T')[0];

            hourMap.set(formattedHour, (hourMap.get(formattedHour) || 0) + thanhTien);

            if (!distinctDates.has(formattedHour)) {
                distinctDates.set(formattedHour, new Set());
            }
            distinctDates.get(formattedHour).add(dateKey);
        }
    });

    let hours = Array.from(hourMap.keys()).sort().map(hour => {
        let totalValue = hourMap.get(hour) || 0;
        let distinctCount = distinctDates.has(hour) ? distinctDates.get(hour).size : 1;
        return { name: hour, value: totalValue / distinctCount };
    });

    let colorScale = d3.scaleOrdinal(d3.schemeSet2).domain(hours.map(d => d.name));

    drawChart(hours, colorScale);
});

function drawChart(data, colorScale) {
    d3.select("#chart").selectAll("*").remove();

    const width = 1200;
    const height = 450;
    const margin = { top: 50, right: 30, bottom: 120, left: 100 };

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const x = d3.scaleBand()
        .domain(data.map(d => d.name))
        .range([margin.left, width - margin.right])
        .padding(0.3);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value) * 1.2])
        .nice()
        .range([height - margin.bottom, margin.top]);

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("font-size", "10px")
        .attr("transform", "rotate(45)")  
        .style("text-anchor", "start");


    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).tickFormat(d => `${Math.round(d / 1e3)}K`))
        .selectAll("text")
        .attr("font-size", "14px");

    svg.selectAll("rect")
        .data(data)
        .enter().append("rect")
        .attr("x", d => x(d.name))
        .attr("y", d => y(d.value))
        .attr("width", x.bandwidth())
        .attr("height", d => height - margin.bottom - y(d.value))
        .attr("fill", d => colorScale(d.name));


    svg.selectAll(".data-label")
        .data(data)
        .enter().append("text")
        .attr("class", "data-label")
        .attr("x", d => x(d.name) + x.bandwidth() / 2)
        .attr("y", d => y(d.value) + 18)
        .attr("text-anchor", "middle")
        .text(d => `${(d.value / 1e3).toFixed(1).replace('.', ',')} K`) 
        .style("fill", "white")
        .style("font-size", "10px")
        .style("font-weight", "bold");
}
