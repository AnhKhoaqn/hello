d3.json("/home/data/").then(function(response) {
    if (!Array.isArray(response) || response.length === 0) {
        alert("Không có dữ liệu hợp lệ!");
        return;
    }

    let totalOrdersByMonth = new Map();
    let groupedDataByCategory = new Map();

    response.forEach(row => {
        let maNhomHang = row["Mã nhóm hàng"];
        let tenNhomHang = row["Tên nhóm hàng"];
        let maMatHang = row["Mã mặt hàng"];
        let tenMatHang = row["Tên mặt hàng"];
        let maDonHang = row["Mã đơn hàng"];
        let thoiGianTao = row["Thời gian tạo đơn"];

        let ngayThangNam = "";
        if (thoiGianTao) {
            let dateObj = new Date(thoiGianTao);
            if (!isNaN(dateObj)) {
                let month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
                ngayThangNam = `Tháng ${month}`;
            }
        }

        if (maNhomHang && tenNhomHang && maMatHang && tenMatHang && maDonHang && ngayThangNam) {
            let categoryKey = `[${maNhomHang}] ${tenNhomHang}`;
            let itemKey = `[${maMatHang}] ${tenMatHang}`;

            if (!groupedDataByCategory.has(categoryKey)) {
                groupedDataByCategory.set(categoryKey, new Map());
            }
            let itemOrdersByMonth = groupedDataByCategory.get(categoryKey);

            if (!itemOrdersByMonth.has(ngayThangNam)) {
                itemOrdersByMonth.set(ngayThangNam, new Map());
            }
            if (!itemOrdersByMonth.get(ngayThangNam).has(itemKey)) {
                itemOrdersByMonth.get(ngayThangNam).set(itemKey, new Set());
            }
            itemOrdersByMonth.get(ngayThangNam).get(itemKey).add(maDonHang);

            if (!totalOrdersByMonth.has(ngayThangNam)) {
                totalOrdersByMonth.set(ngayThangNam, new Set());
            }
            totalOrdersByMonth.get(ngayThangNam).add(maDonHang);
        }
    });

    d3.select("#chart-container").html("");

    groupedDataByCategory.forEach((itemOrdersByMonth, categoryName) => {
        let groupedData = new Map();
        itemOrdersByMonth.forEach((itemsMap, monthKey) => {
            let totalSLDon = totalOrdersByMonth.get(monthKey).size || 1;
            itemsMap.forEach((orders, itemName) => {
                if (!groupedData.has(itemName)) {
                    groupedData.set(itemName, []);
                }
                groupedData.get(itemName).push({
                    month: monthKey,
                    probability: orders.size / totalSLDon
                });
            });
        });

        let formattedData = Array.from(groupedData, ([name, values]) => ({
            name,
            values: values.sort((a, b) => a.month.localeCompare(b.month))
        }));


        let chartDiv = d3.select("#chart-container").append("div")
            .attr("class", "chart-section");

        chartDiv.append("h3").text(`Biểu đồ nhóm hàng: ${categoryName}`);

        let chartId = `chart-${categoryName.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "")}`;
        chartDiv.append("div").attr("id", chartId);

        let colorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(formattedData.map(d => d.name));
        drawLineChart(formattedData, colorScale, `#${chartId}`);
    });
});

function drawLineChart(data, colorScale, chartId) {
    d3.select(chartId).selectAll("*").remove();

    const width = 1000;
    const height = 500;
    const margin = { top: 50, right: 100, bottom: 50, left: 80 };

    const svg = d3.select(chartId)
        .append("svg")
        .attr("width", width + margin.right)
        .attr("height", height);

    const x = d3.scalePoint()
        .domain([...new Set(data.flatMap(d => d.values.map(v => v.month)))])
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data.flatMap(d => d.values.map(v => v.probability))) * 1.1 || 0.1])
        .range([height - margin.bottom, margin.top]);

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).tickFormat(d => `${(d * 100).toFixed(1)}%`));

    const line = d3.line()
        .x(d => x(d.month))
        .y(d => y(d.probability))
        .curve(d3.curveMonotoneX);

    svg.selectAll(".line")
        .data(data)
        .enter().append("path")
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", d => colorScale(d.name))
        .attr("stroke-width", 2)
        .attr("d", d => line(d.values));

    svg.selectAll(".dot")
        .data(data.flatMap(d => d.values.map(v => ({ name: d.name, ...v }))))
        .enter().append("circle")
        .attr("class", "dot")
        .attr("cx", d => x(d.month))
        .attr("cy", d => y(d.probability))
        .attr("r", 5)
        .attr("fill", d => colorScale(d.name));

    svg.selectAll(".label")
        .data(data.flatMap(d => d.values.map(v => ({ name: d.name, ...v }))))
        .enter().append("text")
        .attr("x", d => x(d.month))
        .attr("y", d => y(d.probability) - 10)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "black")
        .text(d => `${(d.probability * 100).toFixed(1)}%`);

    drawLegend(svg, data.map(d => d.name), colorScale, width);
}

function drawLegend(svg, categories, colorScale, chartWidth) {
    const legendX = chartWidth - 100;
    const legendY = 50;

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
            .attr("font-size", "14px")
            .attr("alignment-baseline", "middle");
    });
}
