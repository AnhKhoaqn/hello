d3.json("/home/data/").then(function(response) {
    if (!Array.isArray(response) || response.length === 0) {
        alert("Không có dữ liệu hợp lệ!");
        return;
    }

    let itemMap = new Map();
    let groupMap = new Map();

    response.forEach(row => {
        let productCode = row["Mã mặt hàng"];
        let productName = row["Tên mặt hàng"];
        let categoryCode = row["Mã nhóm hàng"];
        let categoryName = row["Tên nhóm hàng"];
        let totalPrice = parseFloat(row["Thành tiền"]) || 0;

        if (productCode && productName && categoryCode && categoryName && totalPrice > 0) {
            let itemKey = `[${productCode}] ${productName}`;
            let groupKey = `[${categoryCode}] ${categoryName}`;

            itemMap.set(itemKey, {
                value: (itemMap.get(itemKey)?.value || 0) + totalPrice,
                group: groupKey
            });

            if (!groupMap.has(groupKey)) {
                groupMap.set(groupKey, new Set());
            }
            groupMap.get(groupKey).add(itemKey);
        }
    });

    let items = Array.from(itemMap, ([name, data]) => ({
        name,
        value: data.value,
        group: data.group
    })).sort((a, b) => b.value - a.value);

    let colorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(Array.from(groupMap.keys()));

    drawChart(items, colorScale, "#chart", groupMap);
}).catch(error => console.error("Lỗi khi tải dữ liệu:", error));

function drawChart(data, colorScale, chartId, groupMap) {
    d3.select(chartId).selectAll("*").remove();

    const width = 1000;
    const height = 600;
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
        .call(d3.axisLeft(y));

    svg.selectAll("rect")
        .data(data)
        .enter().append("rect")
        .attr("x", margin.left)
        .attr("y", d => y(d.name))
        .attr("width", d => x(d.value) - margin.left)
        .attr("height", y.bandwidth())
        .attr("fill", d => colorScale(d.group));

    svg.selectAll(".label")
        .data(data)
        .enter().append("text")
        .attr("class", "label")
        .attr("x", d => x(d.value) - 5)
        .attr("y", d => y(d.name) + y.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .text(d => {
            let valueText = `${Math.round(d.value / 1e6)}M`;
            let maxWidth = x(d.value) - margin.left - 10;
            return valueText.length * 10 > maxWidth ? valueText.substring(0, 4) + "." : valueText;
        })
        .attr("font-size", "12px")
        .attr("fill", "white");

    drawLegend(svg, Array.from(groupMap.keys()), colorScale, width);
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
