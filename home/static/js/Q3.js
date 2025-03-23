d3.json("/home/data/").then(function(response) {
    if (!Array.isArray(response) || response.length === 0) {
        alert("Không có dữ liệu hợp lệ!");
        return;
    }

    let monthMap = new Map();

    response.forEach(row => {
        let dateStr = row["Thời gian tạo đơn"];
        let thanhTien = parseFloat(row["Thành tiền"]) || 0;
        
        if (dateStr && thanhTien > 0) {
            let date = new Date(dateStr);
            let monthKey = `Tháng ${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + thanhTien);
        }
    });

    let months = Array.from(monthMap, ([name, value]) => ({ name, value }))
        .sort((a, b) => a.name.localeCompare(b.name));
    
    let colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(months.map(d => d.name));

    drawChart(months, colorScale);
    drawLegend(months.map(d => d.name), colorScale);
});

function drawChart(data, colorScale) {
    d3.select("#chart").selectAll("*").remove();

    const width = 800;  
    const height = 500;
    const margin = { top: 20, right: 50, bottom: 80, left: 100 }; 

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
        .attr("font-size", "12px")
        .attr("transform", "rotate(30)")
        .style("text-anchor", "start");

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).tickFormat(d => `${d / 1e6}M`))
        .selectAll("text")
        .attr("font-size", "12px");


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
        .attr("y", d => y(d.value) + 20)  
        .attr("text-anchor", "middle")  
        .text(d => `${Math.round(d.value / 1e6)} triệu VND`) 
        .style("fill", "white") 
        .style("font-size", "6px")  
        .style("font-weight");
}

function drawLegend(categories, colorScale) {
    d3.select("#legend").selectAll("*").remove();

    const legend = d3.select("#legend")
        .append("div")
        .attr("class", "legend-container");

    legend.append("div")
        .attr("class", "legend-title")
        .text("Tháng");

    const legendItems = legend.selectAll(".legend-item")
        .data(categories)
        .enter().append("div")
        .attr("class", "legend-item")
        .style("display", "flex")
        .style("align-items", "center")
        .style("margin-bottom", "5px");

    legendItems.append("div")
        .style("width", "15px")
        .style("height", "15px")
        .style("margin-right", "5px")
        .style("background", d => colorScale(d));

    legendItems.append("span").text(d => d);
}
