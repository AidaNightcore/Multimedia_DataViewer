# Multimedia_DataViewer
Construirea unei aplicații pentru vizualizarea unui set de date. Setul de date care cuprinde informații despre indicatorii “PIB pe cap de locuitor”, “Speranță de Viață” și “Populație” pentru țările Uniunii Europene în perioada 2000-2018 se va descărca de la adresa http://ase.softmentor.ro/eurostat.json (și va fi salvat în folder-ul media)  

2p - preluare automată la pornirea aplicației a datelor curente despre PIB pe cap de locuitor / Speranta Viata / Populație pentru țările UE pentru ultimii 15 ani disponibili și procesare pentru aducerea la forma din fișierul furnizat. Documentația este disponibilă la adresa:  https://wikis.ec.europa.eu/display/EUROSTATHELP/API+Statistics+-+data+query ; seturile de date folosite sunt: sdg_08_10?na_item=B1GQ&unit=CLV10_EUR_HAB, 
demo_mlexpec?sex=T&age=Y1 și demo_pjan?sex=T&age=TOTAL; lista de țări este: BE, BG, CZ, DK, DE, EE, IE, EL, ES, FR, HR, IT, CY, LV, LT, LU, HU, MT, NL, AT, PL, PT, RO, SI, SK, FI, SE  

Exemplu de apel (2 țări și 2 ani): https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/demo_mlexpec?sex=T&age=Y1&time=2019&time=2020&geo=RO&geo=BG
1p - afișare grafică evoluție pentru un indicator (PIB/SV/Pop) și o țară selectată de către utilizator - se va folosi un element de tip SVG (grafică vectorială);  tipul de grafic (linie, histogramă, …) este la alegere  
1p - pentru graficul de la punctul anterior să se afișeze un tooltip care să afișeze anul și valorile pentru PIB/SV/Pop pentru perioada corespunzătoare poziției mouse-ului  
1p - afișare bubble chart pentru un an selectat de utilizator folosind un element de tip canvas (grafică raster)  
1p - animație bubble chart (afișare bubble chart succesiv pentru toți anii)  
2p - afișare sub formă de tabel a datelor disponibile pentru un an selectat de către utilizator (tarile pe linii și cei trei indicatori pe coloană); fiecare celulă va primi o culoare (de la roșu la verde) în funcție de distanța față de media uniunii  
