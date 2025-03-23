d3.json("/home/data/").then(function(response) {
    if (!Array.isArray(response) || response.length === 0) {
        alert("Không có dữ liệu hợp lệ!");
        return;
    }



    let tempTable = new Map();

    response.forEach(d => {
        let customerID = d["Mã khách hàng"];
        let orderID = d["Mã đơn hàng"];

        if (!tempTable.has(customerID)) {
            tempTable.set(customerID, new Set());
        }
        tempTable.get(customerID).add(orderID);
    });


    let purchaseDistribution = new Map();

    tempTable.forEach((orders, customerID) => {
        let orderCount = orders.size;
        if (!purchaseDistribution.has(orderCount)) {
            purchaseDistribution.set(orderCount, 0);
        }
        purchaseDistribution.set(orderCount, purchaseDistribution.get(orderCount) + 1);
    });


    let formattedData = Array.from(purchaseDistribution, ([orders, customers]) => ({
        orders: +orders, 
        customers: +customers
    })).sort((a, b) => a.orders - b.orders);

    drawBarChart(formattedData);
});

function drawBarChart(data) {
    d3.select("#chart").selectAll("*").remove();

    const width = 1000;
    const height = 500;
    const margin = { top: 50, right: 50, bottom: 80, left: 100 };

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.right)
        .attr("height", height);

    const x = d3.scaleBand()
        .domain(data.map(d => d.orders))
        .range([margin.left, width - margin.right])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.customers) * 1.2])
        .nice()
        .range([height - margin.bottom, margin.top]);


    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat(d => d))
        .selectAll("text")
        .attr("transform", "rotate(45)")
        .style("text-anchor", "start")
        .attr("font-size", "12px");


    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y))
        .selectAll("text")
        .attr("font-size", "14px");


    svg.selectAll("rect")
        .data(data)
        .enter().append("rect")
        .attr("x", d => x(d.orders))
        .attr("y", d => y(d.customers))
        .attr("width", x.bandwidth())
        .attr("height", d => height - margin.bottom - y(d.customers))
        .attr("fill", "dodgerblue");


    svg.selectAll(".data-label")
        .data(data)
        .enter().append("text")
        .attr("class", "data-label")
        .attr("x", d => x(d.orders) + x.bandwidth() / 2)
        .attr("y", d => y(d.customers) - 10)
        .attr("text-anchor", "middle")
        .text(d => d.customers)
        .style("fill", "black")
        .style("font-size", "12px")
        .style("font-weight", "bold");


    svg.append("text")
        .attr("x", width / 2)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .style("fill", "#008080")
        .text("Phân phối số lượt mua hàng của khách hàng");
}
