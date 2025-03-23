d3.json("/home/data/").then(function(response) {
    if (!Array.isArray(response) || response.length === 0) {
        alert("Không có dữ liệu hợp lệ!");
        return;
    }


    let dayMap = new Map();
    let distinctDates = new Map();

    response.forEach(row => {
        let dateStr = row["Thời gian tạo đơn"];
        let thanhTien = parseFloat(row["Thành tiền"]) || 0;
        
        if (dateStr && thanhTien > 0) {
            let date = new Date(dateStr);
            let dayOfMonth = date.getDate();
            let formattedDay = dayOfMonth < 10 ? `Ngày 0${dayOfMonth}` : `Ngày ${dayOfMonth}`;
            let dateKey = date.toISOString().split('T')[0];

            dayMap.set(formattedDay, (dayMap.get(formattedDay) || 0) + thanhTien);

            if (!distinctDates.has(formattedDay)) {
                distinctDates.set(formattedDay, new Set());
            }
            distinctDates.get(formattedDay).add(dateKey);
        }
    });

    let days = Array.from(dayMap.keys()).sort((a, b) => {
        return parseInt(a.split(" ")[1]) - parseInt(b.split(" ")[1]);
    }).map(day => {
        let totalValue = dayMap.get(day) || 0;
        let distinctCount = distinctDates.has(day) ? distinctDates.get(day).size : 1;
        return { name: day, value: totalValue / distinctCount };
    });

    let colorScale = d3.scaleOrdinal(d3.schemeSet2).domain(days.map(d => d.name));

    drawChart(days, colorScale);
});

function drawChart(data, colorScale) {
    d3.select("#chart").selectAll("*").remove();

    const width = 1100;
    const height = 450;
    const margin = { top: 50, right: 30, bottom: 100, left: 100 }; 

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
        .attr("transform", "rotate(45)")  
        .style("text-anchor", "start");

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).tickFormat(d => `${Math.round(d / 1e6)}M`))
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
        .text(d => `${(d.value / 1e6).toFixed(1)} tr`)  
        .style("fill", "white") 
        .style("font-size", "12px")  
        .style("font-weight", "bold");
}
