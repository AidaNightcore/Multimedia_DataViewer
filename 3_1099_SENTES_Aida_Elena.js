// ------------------------------------------------------------------------------------------------
// 1: Initializari/ Configurari
// ------------------------------------------------------------------------------------------------

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

  const elements = {
    countrySelect: document.getElementById("country"),
    indicatorSelect: document.getElementById("indicator"),
    chart: document.getElementById("chart"),
    tooltip: document.getElementById("tooltip"),
    bubbleChart: document.getElementById("bubbleChart"),
    bubbleYearInput: document.getElementById("bubbleYear"),
    yearInput: document.getElementById("year"),
    dataTable: document.getElementById("dataTable").querySelector("tbody"),
  };

  let data = [];

  let animationInterval = null;

  countries.forEach((country) => {
    const option = new Option(country, country);
    elements.countrySelect.appendChild(option);
  });

  // ------------------------------------------------------------------------------------------------
  // 2: Functiile de extragere a datelor
  // ------------------------------------------------------------------------------------------------

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

      // Combina datele intr-un singur array cu indicatori (POP, SV, PIB)
      data = responses.flatMap((response, index) => {
        const { geo, time } = response.dimension;
        const values = response.value;
        const indicators = ["POP", "SV", "PIB"];

        return Object.keys(geo.category.index).flatMap((country, cIdx) => {
          return Object.keys(time.category.index)
            .map((year, tIdx) => {
              const valueIdx =
                tIdx * Object.keys(geo.category.index).length + cIdx;
              const value = values[valueIdx];
              return value != null
                ? { country, year: +year, indicator: indicators[index], value }
                : null;
            })
            .filter(Boolean);
        });
      });
    } catch (error) {
      console.error("Erori in Fetching:", error);
    }
  };

  // ------------------------------------------------------------------------------------------------
  // 3: Functiile de grafice
  // ------------------------------------------------------------------------------------------------

  /**
   * Prin drawChart(), se filtreaza datele dupa tara si indicatorul selectate
   * si deseneaza un grafic cu cercuri intr-un element SVG.
   * Afiseaza un tooltip la mouseover.
   */

  const drawChart = () => {
    const { countrySelect, indicatorSelect, chart, tooltip } = elements;

    // Filtreaza datele pentru tara si indicatorul selectat
    const filteredData = data.filter(
      (d) =>
        d.country === countrySelect.value &&
        d.indicator === indicatorSelect.value
    );

    const years = filteredData.map((d) => d.year);
    const values = filteredData.map((d) => d.value);

    chart.innerHTML = "";
    const svgNS = "http://www.w3.org/2000/svg";

    const maxVal = Math.max(...values);

    // Pastrez coordonatele (x, y) intr-un array pentru fiecare cerc
    const points = values.map((val, i) => {
      const x = 30 + (i / (values.length - 1)) * 900;
      const y = 500 - (val / maxVal) * 450;
      return { x, y };
    });

    // Desenez o linie intre fiecare pereche de puncte consecutive
    for (let i = 0; i < points.length - 1; i++) {
      const line = document.createElementNS(svgNS, "line");
      line.setAttribute("x1", points[i].x);
      line.setAttribute("y1", points[i].y);
      line.setAttribute("x2", points[i + 1].x);
      line.setAttribute("y2", points[i + 1].y);

      line.setAttribute("stroke", "#70A9BC");
      line.setAttribute("stroke-width", "2");

      chart.appendChild(line);
    }

    // Deseneaz un cerc pentru fiecare punct
    points.forEach((point, i) => {
      const circle = document.createElementNS(svgNS, "circle");
      circle.setAttribute("cx", point.x);
      circle.setAttribute("cy", point.y);
      circle.setAttribute("r", 5);
      circle.setAttribute("fill", "#70A9BC");

      // Afiseaza tooltip la mouseover
      circle.addEventListener("mousemove", (e) => {
        tooltip.style.display = "block";
        tooltip.style.left = e.pageX + 10 + "px";
        tooltip.style.top = e.pageY - 20 + "px";
        tooltip.textContent = `Year: ${years[i]}, Value: ${values[i]}`;
      });

      // Ascunde tooltipul la mouseout
      circle.addEventListener("mouseleave", () => {
        tooltip.style.display = "none";
      });

      chart.appendChild(circle);
    });
  };

  /**
   * Prin drawBubbleChart(year), se filtreaza datele pentru un an si deseneaza
   * un grafic cu baloane intr-un Canvas. Marimea fiecarui cerc
   * este proportionala cu valoarea indicatorului.
   */

  const drawBubbleChart = (year) => {
    const { bubbleChart } = elements;
    const ctx = bubbleChart.getContext("2d");
    ctx.clearRect(0, 0, bubbleChart.width, bubbleChart.height);

    const filteredData = data.filter((d) => d.year === year);

    // Calculeaza valorile maxime pentru fiecare indicator (POP, PIB, SV)
    const maxValues = {
      POP: Math.max(
        ...filteredData.filter((d) => d.indicator === "POP").map((d) => d.value)
      ),
      PIB: Math.max(
        ...filteredData.filter((d) => d.indicator === "PIB").map((d) => d.value)
      ),
      SV: Math.max(
        ...filteredData.filter((d) => d.indicator === "SV").map((d) => d.value)
      ),
    };

    // Deseneaza cate un cerc pentru fiecare tara si indicator
    filteredData.forEach((d) => {
      const x = Math.random() * bubbleChart.width;
      const y = Math.random() * bubbleChart.height;
      const radius = (d.value / maxValues[d.indicator]) * 30;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle =
        d.indicator === "PIB"
          ? "rgba(112, 169, 188, 0.5)"
          : d.indicator === "SV"
          ? "rgba(147, 158, 114, 0.5)"
          : "rgba(214, 211, 204, 0.5)";
      ctx.fill();
    });
  };

  /**
   * Prin animateBubbleChart(), se ruleaza un interval care parcurge toti anii
   * si deseneaza graficul de tip bubbles pentru fiecare an
   */

  const animateBubbleChart = () => {
    // Opreste orice animatie anterioara
    clearInterval(animationInterval);

    const { bubbleChart } = elements;
    const ctx = bubbleChart.getContext("2d");

    const years = [...new Set(data.map((d) => d.year))].sort();
    let yearIndex = 0;

    // Parcurge anii si apeleaza drawBubbleChart() pentru fiecare
    animationInterval = setInterval(() => {
      if (yearIndex >= years.length) {
        clearInterval(animationInterval);
        return;
      }
      drawBubbleChart(years[yearIndex++]);
    }, 1000);
  };

  const stopAnimation = () => {
    clearInterval(animationInterval);
  };

  // ------------------------------------------------------------------------------------------------
  // 4: Actualizarea tabelului de date
  // ------------------------------------------------------------------------------------------------

  /**
   * Prin updateTable(), se actualizeaza tabelul cu valorile pentru PIB, SV si Populatie
   * in functie de anul selectat. Calculeaza mediile pentru fiecare indicator si
   * coloreaza celulele in functie de abaterea fata de medie.
   */
  const updateTable = () => {
    const { yearInput, dataTable } = elements;
    const year = +yearInput.value;

    const filteredData = data.filter((d) => d.year === year);

    const indicators = ["PIB", "SV", "POP"];

    // Calculeaza mediile pe fiecare indicator
    const averages = indicators.map((ind) => {
      const values = filteredData
        .filter((d) => d.indicator === ind)
        .map((d) => d.value);
      return values.length
        ? values.reduce((a, b) => a + b, 0) / values.length
        : 0;
    });

    dataTable.innerHTML = "";

    // Pentru fiecare tara, construieste un rand si insereaza valorile
    countries.forEach((country) => {
      const row = document.createElement("tr");
      const countryCell = document.createElement("td");
      countryCell.textContent = country;
      row.appendChild(countryCell);

      indicators.forEach((ind, idx) => {
        const value =
          filteredData.find((d) => d.country === country && d.indicator === ind)
            ?.value || "N/A";
        const cell = document.createElement("td");
        cell.textContent = value;

        // Daca valoarea este numerica, se aplica colorarea bazata pe abaterea fata de medie
        if (value !== "N/A") {
          const deviation = value - averages[idx];
          const maxDeviation = Math.max(
            ...filteredData
              .filter((d) => d.indicator === ind)
              .map((d) => Math.abs(d.value - averages[idx]))
          );
          const intensity = Math.min(
            255,
            Math.floor((deviation / maxDeviation) * 128 + 128)
          );
          cell.style.backgroundColor =
            deviation >= 0
              ? `rgb(${255 - intensity}, 255, ${255 - intensity})`
              : `rgb(255, ${intensity}, ${intensity})`;
        }

        row.appendChild(cell);
      });

      dataTable.appendChild(row);
    });
  };

  // ------------------------------------------------------------------------------------------------
  // 5: EventListeners
  // ------------------------------------------------------------------------------------------------

  document.getElementById("updateChart").addEventListener("click", drawChart);

  document.getElementById("updateTable").addEventListener("click", updateTable);

  document
    .getElementById("stopAnimation")
    .addEventListener("click", stopAnimation);

  document.getElementById("updateBubbleChart").addEventListener("click", () => {
    drawBubbleChart(+elements.bubbleYearInput.value);
  });

  document
    .getElementById("animateChart")
    .addEventListener("click", animateBubbleChart);

  fetchData();
});
