document.addEventListener("DOMContentLoaded", () => {
  const countries = [
    "BE",
    "BG",
    "CZ",
    "DK",
    "DE",
    "EE",
    "IE",
    "EL",
    "ES",
    "FR",
    "HR",
    "IT",
    "CY",
    "LV",
    "LT",
    "LU",
    "HU",
    "MT",
    "NL",
    "AT",
    "PL",
    "PT",
    "RO",
    "SI",
    "SK",
    "FI",
    "SE",
  ];
  const countrySelect = document.getElementById("country");
  const indicatorSelect = document.getElementById("indicator");
  const chart = document.getElementById("chart");
  const tooltip = document.getElementById("tooltip");
  const bubbleChart = document.getElementById("bubbleChart");
  const bubbleYearInput = document.getElementById("bubbleYear");
  const yearInput = document.getElementById("year");
  const dataTable = document.getElementById("dataTable").querySelector("tbody");

  let data = [];
  let animationInterval = null;

  // Populate country dropdown
  countries.forEach((country) => {
    const option = document.createElement("option");
    option.value = country;
    option.textContent = country;
    countrySelect.appendChild(option);
  });

  const fetchData = async () => {
    const years = Array.from({ length: 19 }, (_, i) => 2000 + i).join("&time=");
    const countriesQuery = countries.join("&geo=");

    const urls = [
      `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/demo_pjan?sex=T&age=TOTAL&time=${years}&geo=${countriesQuery}`,
      `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/demo_mlexpec?sex=T&age=Y1&time=${years}&geo=${countriesQuery}`,
      `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/sdg_08_10?na_item=B1GQ&unit=CLV10_EUR_HAB&time=${years}&geo=${countriesQuery}`,
    ];

    try {
      const responses = await Promise.all(
        urls.map((url) => fetch(url).then((res) => res.json()))
      );
      const processAPIData = (responses) => {
        const [popData, svData, gdpData] = responses;
        const dimensions = popData.dimension;
        const geo = dimensions.geo.category.index;
        const time = dimensions.time.category.index;

        const parseData = (data, indicator) => {
          const values = data.value;
          const parsed = [];

          Object.keys(geo).forEach((country, countryIndex) => {
            Object.keys(time).forEach((year, yearIndex) => {
              const valueIndex =
                yearIndex * Object.keys(geo).length + countryIndex;
              if (values[valueIndex] != null) {
                parsed.push({
                  tara: country,
                  an: parseInt(year),
                  indicator: indicator,
                  valoare: values[valueIndex],
                });
              }
            });
          });

          return parsed;
        };

        return [
          ...parseData(popData, "POP"),
          ...parseData(svData, "SV"),
          ...parseData(gdpData, "PIB"),
        ];
      };

      data = processAPIData(responses);
      console.log("Data loaded successfully.", data);
    } catch (error) {
      console.error("Error fetching data from API:", error);
    }
  };

  const drawChart = () => {
    const country = countrySelect.value;
    const indicator = indicatorSelect.value;
    const filteredData = data.filter(
      (item) => item.tara === country && item.indicator === indicator
    );

    const years = filteredData.map((item) => item.an);
    const values = filteredData.map((item) => item.valoare);

    chart.innerHTML = "";
    const svgNS = "http://www.w3.org/2000/svg";

    const max = Math.max(...values);
    years.forEach((year, index) => {
      const x = (index / years.length) * 800;
      const y = 400 - (values[index] / max) * 400;

      const circle = document.createElementNS(svgNS, "circle");
      circle.setAttribute("cx", x);
      circle.setAttribute("cy", y);
      circle.setAttribute("r", 5);
      circle.setAttribute("fill", "blue");
      circle.addEventListener("mousemove", (event) => {
        tooltip.style.display = "block";
        tooltip.style.left = event.pageX + 10 + "px";
        tooltip.style.top = event.pageY - 20 + "px";
        tooltip.textContent = `Year: ${year}, Value: ${values[index]}`;
      });
      circle.addEventListener("mouseleave", () => {
        tooltip.style.display = "none";
      });
      chart.appendChild(circle);
    });
  };

  const updateTable = () => {
    const year = parseInt(yearInput.value);
    dataTable.innerHTML = "";

    const filteredData = data.filter((item) => item.an === year);
    const columns = ["PIB", "SV", "POP"];

    const columnAverages = columns.map((indicator) => {
      const values = filteredData
        .filter((item) => item.indicator === indicator)
        .map((item) => item.valoare);
      return values.length
        ? values.reduce((a, b) => a + b, 0) / values.length
        : 0;
    });

    countries.forEach((country) => {
      const row = document.createElement("tr");

      const nameCell = document.createElement("td");
      nameCell.textContent = country;
      row.appendChild(nameCell);

      columns.forEach((indicator, index) => {
        const value =
          filteredData.find(
            (item) => item.tara === country && item.indicator === indicator
          )?.valoare || "N/A";
        const cell = document.createElement("td");
        cell.textContent = value;

        if (value !== "N/A") {
          const deviation = value - columnAverages[index];
          const maxDeviation = Math.max(
            ...filteredData
              .filter((item) => item.indicator === indicator)
              .map((item) => Math.abs(item.valoare - columnAverages[index]))
          );

          const colorIntensity = Math.min(
            255,
            Math.floor((deviation / maxDeviation) * 128 + 128)
          );
          const color =
            deviation >= 0
              ? `rgb(${255 - colorIntensity}, 255, ${255 - colorIntensity})`
              : `rgb(255, ${colorIntensity}, ${colorIntensity})`;

          cell.style.backgroundColor = color;
        }

        row.appendChild(cell);
      });

      dataTable.appendChild(row);
    });
  };

  const drawStaticBubbleChart = (year) => {
    clearInterval(animationInterval);
    const ctx = bubbleChart.getContext("2d");
    ctx.clearRect(0, 0, bubbleChart.width, bubbleChart.height);

    const filteredData = data.filter((item) => item.an === year);

    filteredData.forEach((item) => {
      const x = Math.random() * 800;
      const y = Math.random() * 400;
      const radius = item.indicator === "POP" ? item.valoare / 10000000 : 10;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle =
        item.indicator === "PIB"
          ? "rgba(0, 0, 255, 0.5)"
          : item.indicator === "SV"
          ? "rgba(0, 255, 0, 0.5)"
          : "rgba(255, 0, 0, 0.5)";
      ctx.fill();
    });
  };

  const animateBubbleChart = () => {
    clearInterval(animationInterval);
    const ctx = bubbleChart.getContext("2d");
    ctx.clearRect(0, 0, bubbleChart.width, bubbleChart.height);

    let yearIndex = 0;
    const years = [...new Set(data.map((item) => item.an))].sort();

    animationInterval = setInterval(() => {
      if (yearIndex >= years.length) {
        clearInterval(animationInterval);
        return;
      }

      const year = years[yearIndex++];
      ctx.clearRect(0, 0, bubbleChart.width, bubbleChart.height);

      const filteredData = data.filter((item) => item.an === year);
      filteredData.forEach((item) => {
        const x = Math.random() * 800;
        const y = Math.random() * 400;
        const radius = item.indicator === "POP" ? item.valoare / 10000000 : 10;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle =
          item.indicator === "PIB"
            ? "rgba(0, 0, 255, 0.5)"
            : item.indicator === "SV"
            ? "rgba(0, 255, 0, 0.5)"
            : "rgba(255, 0, 0, 0.5)";
        ctx.fill();
      });
    }, 1000);
  };

  document.getElementById("updateChart").addEventListener("click", drawChart);
  document.getElementById("updateTable").addEventListener("click", updateTable);
  document.getElementById("updateBubbleChart").addEventListener("click", () => {
    const year = parseInt(bubbleYearInput.value);
    drawStaticBubbleChart(year);
  });
  document
    .getElementById("animateChart")
    .addEventListener("click", animateBubbleChart);

  fetchData();
});
