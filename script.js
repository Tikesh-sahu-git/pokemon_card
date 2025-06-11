document.addEventListener('DOMContentLoaded', function() {
    const cardsGrid = document.getElementById('cardsGrid');
    const randomTeamBtn = document.getElementById('randomTeamBtn');
    const flipAllBtn = document.getElementById('flipAllBtn');
    const loadingContainer = document.getElementById('loading-container');
    
    // Generate initial team
    generateRandomTeam();
    
    // Event listeners
    randomTeamBtn.addEventListener('click', generateRandomTeam);
    flipAllBtn.addEventListener('click', flipAllCards);
    
    function showLoading() {
        loadingContainer.innerHTML = `
            <div class="loading-overlay">
                <div class="pokeball-loader"></div>
                <div class="loading-text">Loading Pokémon...</div>
            </div>
        `;
    }
    
    function hideLoading() {
        const loader = document.querySelector('.loading-overlay');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loadingContainer.innerHTML = '';
            }, 500);
        }
    }
    
    function generateRandomTeam() {
        showLoading();
        
        // Animate out existing cards
        const cards = document.querySelectorAll('.pokemon-card');
        if (cards.length > 0) {
            cards.forEach((card, index) => {
                card.style.animation = `fadeOut 0.5s ease-in ${index * 0.1}s forwards`;
                setTimeout(() => {
                    if (card.parentNode) {
                        cardsGrid.removeChild(card);
                    }
                }, 500 + (index * 100));
            });
            
            setTimeout(fetchNewTeam, 600);
        } else {
            fetchNewTeam();
        }
    }
    
    function fetchNewTeam() {
        const teamSize = 6;
        const pokemonIds = [];
        
        while (pokemonIds.length < teamSize) {
            const randomId = Math.floor(Math.random() * 151) + 1;
            if (!pokemonIds.includes(randomId)) {
                pokemonIds.push(randomId);
            }
        }
        
        const fetchPromises = pokemonIds.map(id => fetchPokemonData(id));
        
        Promise.all(fetchPromises)
            .then(() => hideLoading())
            .catch(() => hideLoading());
    }
    
    function fetchPokemonData(pokemonId) {
        return fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                createPokemonCard(data);
                return data;
            })
            .catch(error => {
                console.error('Error fetching Pokémon data:', error);
                // Try another random Pokémon if this one fails
                return fetchPokemonData(Math.floor(Math.random() * 151) + 1);
            });
    }
    
    function createPokemonCard(pokemonData) {
        const card = document.createElement('div');
        card.className = 'pokemon-card loading-card';
        
        // Capitalize Pokémon name
        const pokemonName = capitalizeFirstLetter(pokemonData.name);
        
        // Create card HTML
        card.innerHTML = `
            <div class="card-inner">
                <div class="card-front">
                    <div class="card-header">
                        <h2 class="pokemon-name">${pokemonName}</h2>
                        <div class="hp">HP <span class="hp-value">${pokemonData.stats[0].base_stat}</span></div>
                    </div>
                    <div class="pokemon-image">
                        <img src="${pokemonData.sprites.other['official-artwork'].front_default || pokemonData.sprites.front_default}" 
                             alt="${pokemonName}"
                             onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonData.id}.png'">
                    </div>
                    <div class="pokemon-type"></div>
                    <div class="pokemon-stats">
                        <div class="stat">
                            <div class="stat-value">${pokemonData.stats[1].base_stat}</div>
                            <div class="stat-name">ATTACK</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value">${pokemonData.stats[2].base_stat}</div>
                            <div class="stat-name">DEFENSE</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value">${pokemonData.stats[5].base_stat}</div>
                            <div class="stat-name">SPEED</div>
                        </div>
                    </div>
                </div>
                <div class="card-back">
                    <div class="card-back-content">
                        <div class="pokemon-description">
                            ${getRandomDescription(pokemonName)}
                        </div>
                        <div class="pokemon-details">
                            <div class="detail">
                                <span class="detail-label">Height:</span>
                                <span class="detail-value">${pokemonData.height / 10}m</span>
                            </div>
                            <div class="detail">
                                <span class="detail-label">Weight:</span>
                                <span class="detail-value">${pokemonData.weight / 10}kg</span>
                            </div>
                            <div class="detail">
                                <span class="detail-label">Abilities:</span>
                                <span class="detail-value">${formatAbilities(pokemonData.abilities)}</span>
                            </div>
                        </div>
                        <div class="pokemon-moves">
                            <h3>Moves</h3>
                            <ul>
                                ${formatMoves(pokemonData.moves)}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add to grid
        cardsGrid.appendChild(card);
        
        // Add type badges with colors
        const typeElement = card.querySelector('.pokemon-type');
        pokemonData.types.forEach(type => {
            const typeBadge = document.createElement('span');
            typeBadge.className = `type-badge ${type.type.name}`;
            typeBadge.textContent = capitalizeFirstLetter(type.type.name);
            typeBadge.style.backgroundColor = getTypeColor(type.type.name);
            typeElement.appendChild(typeBadge);
        });
        
        // Add low HP class if HP is below 50
        const hpValue = card.querySelector('.hp-value');
        if (pokemonData.stats[0].base_stat < 50) {
            hpValue.classList.add('low');
        }
        
        // Add click event to flip card
        card.addEventListener('click', function() {
            this.classList.toggle('flipped');
        });
        
        // Remove loading class after animation completes
        setTimeout(() => {
            card.classList.remove('loading-card');
        }, 600);
        
        // Add hover animation for attack stat
        const attackStat = card.querySelector('.stat:nth-child(1)');
        attackStat.addEventListener('mouseenter', function() {
            this.classList.add('attacking');
            setTimeout(() => {
                this.classList.remove('attacking');
            }, 500);
        });
    }
    
    function flipAllCards() {
        const cards = document.querySelectorAll('.pokemon-card');
        const allFlipped = Array.from(cards).every(card => card.classList.contains('flipped'));
        
        cards.forEach((card, index) => {
            setTimeout(() => {
                if (allFlipped) {
                    card.classList.remove('flipped');
                } else {
                    card.classList.add('flipped');
                }
            }, index * 100); // Stagger the flips
        });
    }
    
    // Helper functions
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    function formatAbilities(abilities) {
        return abilities.map(ability => 
            ability.ability.name.split('-').map(word => 
                capitalizeFirstLetter(word))
            .join(' '))
        .join(', ');
    }
    
    function formatMoves(moves) {
        // Get 4 random moves
        const selectedMoves = [];
        const moveCount = Math.min(4, moves.length);
        
        while (selectedMoves.length < moveCount) {
            const randomIndex = Math.floor(Math.random() * moves.length);
            const move = moves[randomIndex];
            const formattedName = move.move.name.split('-').map(word => 
                capitalizeFirstLetter(word))
                .join(' ');
            
            if (!selectedMoves.includes(formattedName)) {
                selectedMoves.push(formattedName);
            }
        }
        
        return selectedMoves.map(move => `<li>${move}</li>`).join('');
    }
    
    function getTypeColor(type) {
        const typeColors = {
            normal: '#A8A878',
            fire: '#F08030',
            water: '#6890F0',
            electric: '#F8D030',
            grass: '#78C850',
            ice: '#98D8D8',
            fighting: '#C03028',
            poison: '#A040A0',
            ground: '#E0C068',
            flying: '#A890F0',
            psychic: '#F85888',
            bug: '#A8B820',
            rock: '#B8A038',
            ghost: '#705898',
            dragon: '#7038F8',
            dark: '#705848',
            steel: '#B8B8D0',
            fairy: '#EE99AC'
        };
        
        return typeColors[type.toLowerCase()] || '#777';
    }
    
    function getRandomDescription(name) {
        const descriptions = [
            `A wild ${name} appeared!`,
            `${name} uses its powers to battle opponents.`,
            `This ${name} is ready for adventure!`,
            `${name}'s electricity can power small towns.`,
            `Watch out for ${name}'s powerful attacks!`,
            `${name} is loyal to its trainer.`,
            `This ${name} has been training hard.`,
            `${name}'s stats are looking strong!`
        ];
        return descriptions[Math.floor(Math.random() * descriptions.length)];
    }
});