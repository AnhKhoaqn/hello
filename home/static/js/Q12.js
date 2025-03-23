d3.json("/home/data/").then(function(response) {
    if (!Array.isArray(response) || response.length === 0) {
        alert("Không có dữ liệu hợp lệ!");
        return;
    }



    let customerSpending = new Map();

    response.forEach(d => {
        let customerID = d["Mã khách hàng"];
        let totalAmount = parseFloat(d["Thành tiền"]) || 0; 

        if (!customerSpending.has(customerID)) {
            customerSpending.set(customerID, 0);
        }
        customerSpending.set(customerID, customerSpending.get(customerID) + totalAmount);
    });


    let spendingBins = new Map();

    customerSpending.forEach((amount, customerID) => {
        let binStart = Math.floor(amount / 50000) * 50000;
        let binLabel = `Từ ${binStart.toLocaleString()} đến ${(binStart + 50000).toLocaleString()}`;

        if (!spendingBins.has(binLabel)) {
            spendingBins.set(binLabel, new Set());
        }
        spendingBins.get(binLabel).add(customerID);
    });


    let formattedData = Array.from(spendingBins, ([bin, customers]) => ({
        bin: bin,
        customers: customers.size
    })).sort((a, b) => b.customers - a.customers); 


    drawBarChart(formattedData);
});

function drawBarChart(data) {
    d3.select("#chart").selectAll("*").remove();

    const width = 1000;
    const height = 500;
    const margin = { top: 50, right: 50, bottom: 120, left: 100 };

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.right)
        .attr("height", height);

    const x = d3.scaleBand()
        .domain(data.map(d => d.bin)) 
        .range([margin.left, width - margin.right])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.customers) * 1.2])
        .nice()
        .range([height - margin.bottom, margin.top]);


    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat(() => "")) 
        .selectAll("text")
        .remove(); 


    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y))
        .selectAll("text")
        .attr("font-size", "14px");


    svg.selectAll("rect")
        .data(data)
        .enter().append("rect")
        .attr("x", d => x(d.bin))
        .attr("y", d => y(d.customers))
        .attr("width", x.bandwidth())
        .attr("height", d => height - margin.bottom - y(d.customers))
        .attr("fill", "steelblue");

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .style("fill", "#008080")
        .text("Phân phối số lượng khách hàng theo mức chi trả");
}
