
        const API_KEY = "4b746f49329f467f96fe53baeeb336e3";
        const searchBar = document.getElementById("searchBar");
        const gamesContainer = document.getElementById("gamesContainer");
        const genreContainer = document.getElementById("genreContainer");
        const filterToggleButton = document.getElementById("filterToggleButton");
        const filterIcon = document.getElementById("filterIcon");
        const paginationContainer = document.getElementById("paginationContainer");
        const prevPageButton = document.getElementById("prevPage");
        const nextPageButton = document.getElementById("nextPage");
        const currentPageDisplay = document.getElementById("currentPage");

        const gamesPerPageSelect = document.getElementById("gamesPerPage");
        const customGamesInput = document.getElementById("customGamesInput");
        
        let ordering = ""; // Valores posibles: "", "-rating", "rating"
        let currentPage = 1;
        let query = "";
        let selectedGenres = [];
        let gamesPerPage = parseInt(gamesPerPageSelect.value); // Por defecto, 10 juegos por página
        const pageData = {}; // Almacena juegos por página

        function getSelectedGenres() {
            return Array.from(
                genreContainer.querySelectorAll("input:checked")
            ).map(input => input.value);
        }

        document.getElementById("sortButton").addEventListener("click", () => {
            if (ordering === "") {
                ordering = "-rating"; // Orden descendente
                document.getElementById("sortButton").textContent = "Puntuación: Descendente";
            } else if (ordering === "-rating") {
                ordering = "rating"; // Orden ascendente
                document.getElementById("sortButton").textContent = "Puntuación: Ascendente";
            } else {
                ordering = ""; // Sin ordenación
                document.getElementById("sortButton").textContent = "Ordenar Puntuación";
            }
            currentPage = 1; // Reinicia a la primera página
            fetchGames(currentPage, query, selectedGenres); // Recarga los juegos con el nuevo criterio de ordenación
        });

        async function fetchGenres() {
            const API_URL = `https://api.rawg.io/api/genres?key=${API_KEY}`;
            try {
                const response = await fetch(API_URL);
                const data = await response.json();
                renderGenres(data.results);
            } catch (error) {
                console.error("Error al obtener géneros:", error);
            }
        }

        function renderGenres(genres) {
            genres.forEach(genre => {
                const genreItem = document.createElement("div");
                genreItem.classList.add("genre-item");
                genreItem.innerHTML = `
                    <label>
                        <input type="checkbox" value="${genre.id}" /> ${genre.name}
                    </label>
                `;
                genreContainer.appendChild(genreItem);
            });
        }

        async function fetchGames(page = 1, searchQuery = "", genres = []) {
            let genreQuery = genres.length ? `&genres=${genres.join(",")}` : "";
            let orderingQuery = ordering ? `&ordering=${ordering}` : "";
            const API_URL = searchQuery
                ? `https://api.rawg.io/api/games?key=${API_KEY}&page=${page}&page_size=${gamesPerPage}&search=${searchQuery}${genreQuery}${orderingQuery}`
                : `https://api.rawg.io/api/games?key=${API_KEY}&page=${page}&page_size=${gamesPerPage}${genreQuery}${orderingQuery}`;

            try {
                const response = await fetch(API_URL);
                if (!response.ok) {
                    throw new Error(`Error en la solicitud: ${response.status}`);
                }

                const data = await response.json();
                if (data.results.length === 0) {
                    gamesContainer.innerHTML = `<p>No se encontraron juegos con los filtros seleccionados.</p>`;
                } else {
                    pageData[page] = data.results; // Almacena los juegos para esta página
                    renderGames(pageData[page]); // Renderiza los juegos
                }

                // Actualizar estado de botones de paginación
                prevPageButton.style.visibility = page > 1 ? "visible" : "hidden";
                currentPageDisplay.textContent = page;

            } catch (error) {
                console.error("Error al obtener los juegos:", error);
                gamesContainer.innerHTML = `<p>Error al cargar los videojuegos. Inténtalo de nuevo más tarde.</p>`;
            }
        }


        function renderGames(games) {
            gamesContainer.innerHTML = ""; // Limpia el contenedor antes de renderizar

            if (games.length === 0) {
                gamesContainer.innerHTML = `<p>No hay juegos disponibles para los filtros seleccionados.</p>`;
                return;
            }

           games.forEach(game => {
               const gameCard = document.createElement("div");
                gameCard.classList.add("game-card");

                gameCard.innerHTML = `
                    <img src="${game.background_image}" alt="${game.name}" class="game-image">
                    <h3 class="game-title">${game.name}</h3>
                    <p class="game-rating">Puntuación: ${game.rating}</p>
                `;

                gameCard.addEventListener("click", () => {
                    localStorage.setItem("selectedGameId", game.id);
                    window.location.href = "details.html";
                });

                gamesContainer.appendChild(gameCard);
            });
        }


        // Eventos de búsqueda y filtrado
        searchBar.addEventListener("input", () => {
            query = searchBar.value.trim();
            currentPage = 1; // Reinicia la página al aplicar una búsqueda
            fetchGames(currentPage, query, selectedGenres); // Realiza la nueva consulta
        });

        genreContainer.addEventListener("change", (event) => {
            if (event.target.type === "checkbox") {
                selectedGenres = getSelectedGenres();
                currentPage = 1; // Reinicia la página al aplicar nuevos filtros
                fetchGames(currentPage, query, selectedGenres); // Realiza la nueva consulta
            }
        });

        // Selector de cantidad de juegos por página
        gamesPerPageSelect.addEventListener("change", () => {
            const selectedValue = gamesPerPageSelect.value;

            if (selectedValue === "custom") {
                customGamesInput.style.display = "inline-block"; // Muestra el campo de entrada
                customGamesInput.focus(); // Enfoca el campo de entrada
            } else {
                customGamesInput.style.display = "none"; // Oculta el campo de entrada
                gamesPerPage = parseInt(selectedValue); // Actualiza la cantidad de juegos
                currentPage = 1;
                fetchGames(currentPage, query, selectedGenres); // Recarga los juegos
            }
        });

        // Manejo del campo personalizado
        customGamesInput.addEventListener("input", () => {
            const customValue = parseInt(customGamesInput.value);

            if (!isNaN(customValue) && customValue > 0) {
                gamesPerPage = customValue; // Actualiza la cantidad de juegos con el valor personalizado
                currentPage = 1;
                fetchGames(currentPage, query, selectedGenres); // Recarga los juegos
            }
        });

        // Alternar visibilidad de los géneros al hacer clic en el botón
        filterToggleButton.addEventListener("click", () => {
            const isOpen = genreContainer.classList.contains("open");

            if (isOpen) {
                genreContainer.classList.remove("open");
                filterIcon.src = "envelope.png"; // Icono cerrado
            } else {
                genreContainer.classList.add("open");
                filterIcon.src = "envelope-open.png"; // Icono abierto
            }
        });

        // Paginación
        // Botón anterior (retroceder una página)
        prevPageButton.addEventListener("click", () => {
            if (currentPage > 1) { // Asegurarse de que no baje de 1
                currentPage--; // Decrementa la página
                fetchGames(currentPage, query, selectedGenres);
                pageNumberDisplay.textContent = currentPage; // Actualiza el número de página
            }
        });

        // Botón siguiente (avanzar una página)
        nextPageButton.addEventListener("click", () => {
            currentPage++; // Incrementa la página
            fetchGames(currentPage, query, selectedGenres);
            pageNumberDisplay.textContent = currentPage; // Actualiza el número de página
        });

        // Inicializar
        fetchGenres();
        fetchGames(currentPage, query, selectedGenres);