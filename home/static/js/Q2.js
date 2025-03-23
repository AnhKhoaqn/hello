d3.json("/home/data/").then(function(response) {
    if (!Array.isArray(response) || response.length === 0) {
        alert("Không có dữ liệu hợp lệ!");
        return;
    }

    let categoryMap = new Map(); // Lưu tổng doanh thu theo nhóm hàng

    response.forEach(row => {
        let maNhomHang = row["Mã nhóm hàng"]; 
        let tenNhomHang = row["Tên nhóm hàng"];
        let thanhTien = Number(row["Thành tiền"]) || 0;

        if (maNhomHang && tenNhomHang && thanhTien > 0) {
            let categoryKey = `[${maNhomHang}] ${tenNhomHang}`;
            categoryMap.set(categoryKey, (categoryMap.get(categoryKey) || 0) + thanhTien);
        }
    });

    // Chuyển Map thành danh sách, sắp xếp giảm dần theo giá trị
    let categories = Array.from(categoryMap, ([name, value]) => ({ name, value }))
                         .sort((a, b) => b.value - a.value);

    let colorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(categories.map(d => d.name));

    drawChart(categories, colorScale, "#chart");
}).catch(error => console.error("Lỗi khi tải dữ liệu:", error));

function drawChart(data, colorScale, chartId) {
    d3.select(chartId).selectAll("*").remove();

    const width = 1000;
    const height = Math.max(600, data.length * 35);
    const margin = { top: 20, right: 320, bottom: 50, left: 300 };

    const svg = d3.select(chartId)
        .append("svg")
        .attr("width", width + margin.right)
        .attr("height", height);

    const maxValue = d3.max(data, d => d.value);
    const x = d3.scaleLinear()
        .domain([0, maxValue * 1.1])
        .range([margin.left, width - margin.right]);

    const y = d3.scaleBand()
        .domain(data.map(d => d.name))
        .range([margin.top, height - margin.bottom])
        .padding(0.2);

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat(d => `${(d / 1e6).toFixed(0)}M`).ticks(5));

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("font-size", "14px");

    svg.selectAll("rect")
        .data(data)
        .enter().append("rect")
        .attr("x", margin.left)
        .attr("y", d => y(d.name))
        .attr("width", d => x(d.value) - margin.left)
        .attr("height", y.bandwidth())
        .attr("fill", d => colorScale(d.name));

    svg.selectAll(".label")
        .data(data)
        .enter().append("text")
        .attr("class", "label")
        .attr("x", d => x(d.value) - 5)
        .attr("y", d => y(d.name) + y.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .text(d => `${Math.round(d.value / 1e6)}M`)
        .attr("font-size", "12px")
        .attr("fill", "white");

    drawLegend(svg, data.map(d => d.name), colorScale, width);
}

function drawLegend(svg, categories, colorScale, chartWidth) {
    const legendX = chartWidth + 50;
    const legendY = 20;

    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${legendX}, ${legendY})`);

    categories.forEach((category, i) => {
        let legendItem = legend.append("g")
            .attr("transform", `translate(0, ${i * 25})`);

        legendItem.append("rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", colorScale(category));

        legendItem.append("text")
            .attr("x", 20)
            .attr("y", 12)
            .text(category)
            .attr("font-size", "13px")
            .attr("alignment-baseline", "middle");
    });
}
