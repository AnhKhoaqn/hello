d3.json("/home/data/").then(function(response) {
    if (!Array.isArray(response) || response.length === 0) {
        alert("Không có dữ liệu hợp lệ!");
        return;
    }

    const weekdaysOrder = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"];

    let dayMap = new Map();
    let distinctDates = new Map(); 

    response.forEach(row => {
        let dateStr = row["Thời gian tạo đơn"];
        let thanhTien = parseFloat(row["Thành tiền"]) || 0;
        
        if (dateStr && thanhTien > 0) {
            let date = new Date(dateStr);
            let dayOfWeek = weekdaysOrder[date.getDay() === 0 ? 6 : date.getDay() - 1]; 
            let dateKey = date.toISOString().split('T')[0];


            dayMap.set(dayOfWeek, (dayMap.get(dayOfWeek) || 0) + thanhTien);
            

            if (!distinctDates.has(dayOfWeek)) {
                distinctDates.set(dayOfWeek, new Set());
            }
            distinctDates.get(dayOfWeek).add(dateKey);
        }
    });

    let days = weekdaysOrder.map(day => {
        let totalValue = dayMap.get(day) || 0;
        let distinctCount = distinctDates.has(day) ? distinctDates.get(day).size : 1; 
        return { name: day, value: totalValue / distinctCount }; 
    });

    let colorScale = d3.scaleOrdinal(d3.schemeSet2).domain(days.map(d => d.name));

    drawChart(days, colorScale);
    drawLegend(days.map(d => d.name), colorScale);
});

function drawChart(data, colorScale) {
    d3.select("#chart").selectAll("*").remove();

    const width = 900;  
    const height = 500;
    const margin = { top: 50, right: 50, bottom: 80, left: 120 }; 

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
        .attr("font-size", "14px")
        .attr("transform", "rotate(20)") 
        .style("text-anchor", "middle");

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).tickFormat(d => `${Math.round(d / 1e6)}M VND`))
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
        .attr("y", d => y(d.value) - 5)  
        .attr("text-anchor", "middle") 
        .text(d => `${Math.round(d.value).toLocaleString()} VND`) 
        .style("fill", "black")
        .style("font-size", "14px")
        .style("font-weight", "bold");
}

function drawLegend(categories, colorScale) {
    d3.select("#legend").selectAll("*").remove();

    const legend = d3.select("#legend")
        .append("div")
        .attr("class", "legend-container");

    legend.append("div")
        .attr("class", "legend-title")
        .text("Ngày trong tuần");

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
