d3.json("/home/data/").then(function(response) {
    if (!Array.isArray(response) || response.length === 0) {
        alert("Không có dữ liệu hợp lệ!");
        return;
    }


    let totalOrders = new Set();
    let categoryOrders = new Map();

    response.forEach(row => {
        let maNhomHang = row["Mã nhóm hàng"];
        let tenNhomHang = row["Tên nhóm hàng"];
        let maDonHang = row["Mã đơn hàng"];

        if (maNhomHang && tenNhomHang && maDonHang) {
            let categoryKey = `[${maNhomHang}] ${tenNhomHang}`;

            if (!categoryOrders.has(categoryKey)) {
                categoryOrders.set(categoryKey, new Set());
            }
            categoryOrders.get(categoryKey).add(maDonHang);
            totalOrders.add(maDonHang);
        }
    });

    let totalSLDon = totalOrders.size;

    let categories = Array.from(categoryOrders, ([name, orders]) => ({
        name,
        probability: orders.size / totalSLDon
    })).sort((a, b) => b.probability - a.probability);

    let colorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(categories.map(d => d.name));

    drawChart(categories, colorScale, "#chart");
});

function drawChart(data, colorScale, chartId) {
    d3.select(chartId).selectAll("*").remove();

    const width = 1000;
    const height = 600;
    const margin = { top: 20, right: 50, bottom: 50, left: 300 };

    const svg = d3.select(chartId)
        .append("svg")
        .attr("width", width + margin.right)
        .attr("height", height);

    const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.probability) * 1.1]) 
        .range([margin.left, width - margin.right]);

    const y = d3.scaleBand()
        .domain(data.map(d => d.name))
        .range([margin.top, height - margin.bottom])
        .padding(0.2);

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat(d => `${(d * 100).toFixed(0)}%`).ticks(5));

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    svg.selectAll("rect")
        .data(data)
        .enter().append("rect")
        .attr("x", margin.left)
        .attr("y", d => y(d.name))
        .attr("width", d => x(d.probability) - margin.left)
        .attr("height", y.bandwidth())
        .attr("fill", d => colorScale(d.name));

    svg.selectAll(".label")
        .data(data)
        .enter().append("text")
        .attr("class", "label")
        .attr("x", d => x(d.probability) - 5)
        .attr("y", d => y(d.name) + y.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .text(d => `${(d.probability * 100).toFixed(1)}%`) 
        .attr("font-size", "12px")
        .attr("fill", "white");
}
