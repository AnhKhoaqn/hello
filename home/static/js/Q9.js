d3.json("/home/data/").then(function(response) {
    if (!Array.isArray(response) || response.length === 0) {
        alert("Không có dữ liệu hợp lệ!");
        return;
    }

    let categoryData = new Map(); 
    let categoryOrders = new Map(); 

    response.forEach(row => {
        let maNhomHang = row["Mã nhóm hàng"];
        let tenNhomHang = row["Tên nhóm hàng"];
        let maMatHang = row["Mã mặt hàng"];
        let tenMatHang = row["Tên mặt hàng"];
        let maDonHang = row["Mã đơn hàng"];

        if (maNhomHang && tenNhomHang && maMatHang && tenMatHang && maDonHang) {
            let categoryKey = `[${maNhomHang}] ${tenNhomHang}`;
            let productKey = `[${maMatHang}] ${tenMatHang}`;

   
            if (!categoryOrders.has(categoryKey)) {
                categoryOrders.set(categoryKey, new Set());
            }
            categoryOrders.get(categoryKey).add(maDonHang);


            if (!categoryData.has(categoryKey)) {
                categoryData.set(categoryKey, new Map());
            }

            let productOrders = categoryData.get(categoryKey);
            if (!productOrders.has(productKey)) {
                productOrders.set(productKey, new Set());
            }

            productOrders.get(productKey).add(maDonHang);
        }
    });


    let chartContainer = d3.select("#chart");
    chartContainer.selectAll("*").remove();


    categoryData.forEach((products, categoryName) => {
        let totalOrdersInCategory = categoryOrders.get(categoryName).size;

        let data = Array.from(products, ([name, orders]) => ({
            name,
            probability: orders.size / totalOrdersInCategory
        })).sort((a, b) => b.probability - a.probability);

        let colorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(data.map(d => d.name));


        let div = chartContainer.append("div")
            .style("margin-bottom", "50px");


        div.append("h3")
            .text(`${categoryName} (Tổng đơn hàng: ${totalOrdersInCategory})`)
            .style("color", "#008080")
            .style("text-align", "center")
            .style("font-size", "18px")
            .style("margin-bottom", "10px");

        let chartId = categoryName.replace(/[^a-zA-Z0-9]/g, "_"); 
        div.append("div").attr("id", chartId);

        drawChart(data, colorScale, `#${chartId}`);
    });
});

function drawChart(data, colorScale, chartId) {
    d3.select(chartId).selectAll("*").remove();

    const width = 1000;
    const height = Math.max(300, data.length * 30);
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
