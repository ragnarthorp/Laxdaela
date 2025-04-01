// script.js

document.addEventListener('DOMContentLoaded', () => {
    let allEvents = [];
    let allCharacters = [];
    let allFamilyTree = [];
    let allLocations = [];

    let timeline = null;

    const tabs = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const timelineContainer = document.getElementById('timeline');
    const charactersListContainer = document.getElementById('characters-list');
    const familyTreeContainer = document.getElementById('familytree-display');
    const locationsListContainer = document.getElementById('locations-list');
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const closeButton = document.querySelector('.close-button');

    async function loadData() {
        try {
            const [eventsRes, charsRes, familyRes, locsRes] = await Promise.all([
                fetch('./events.json'),
                fetch('./characters.json'),
                fetch('./familytree.json'),
                fetch('./locations.json')
            ]);

            if (!eventsRes.ok || !charsRes.ok || !familyRes.ok || !locsRes.ok) {
                throw new Error('Villa við að hlaða JSON gögnum');
            }

            allEvents = await eventsRes.json();
            allCharacters = await charsRes.json();
            allFamilyTree = await familyRes.json();
            allLocations = await locsRes.json();

            renderTimeline();
            setupTabs();

        } catch (error) {
            console.error("Villa við að sækja eða vinna úr JSON:", error);
            timelineContainer.innerHTML = "<p>Ekki tókst að hlaða inn gögnum fyrir tímalínu.</p>";
        }
    }

    function setupTabs() {
        tabs.forEach(button => {
            button.addEventListener('click', () => {
                const targetId = button.getAttribute('data-target');

                tabs.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                tabContents.forEach(content => {
                    if (content.id === targetId) {
                        content.classList.add('active');
                        if (targetId === 'characters-content' && charactersListContainer.children.length <= 1) {
                            renderCharacters();
                        } else if (targetId === 'familytree-content' && familyTreeContainer.children.length <= 1) {
                            renderFamilyTree();
                        } else if (targetId === 'locations-content' && locationsListContainer.children.length <= 1) {
                            renderLocations();
                        }
                    } else {
                        content.classList.remove('active');
                    }
                });
            });
        });
    }

    function renderTimeline() {
        if (!allEvents.length || !vis || !timelineContainer) return;

        const items = new vis.DataSet(allEvents.map(event => {
            const startDate = event.year ? `${event.year}-01-01` : null;
            if (!startDate) return null;
            return {
                id: event.id,
                content: event.title,
                start: startDate,
                data: event
            };
        }).filter(item => item !== null));

        const options = {
            stack: true,
            zoomMin: 1000 * 60 * 60 * 24 * 365 * 1,
            zoomMax: 1000 * 60 * 60 * 24 * 365 * 500,
            start: new Date(Math.min(...allEvents.map(e => e.year).filter(y => y)) - 50, 0, 1),
            end: new Date(Math.max(...allEvents.map(e => e.year).filter(y => y)) + 50, 11, 31),
            height: '500px',
            editable: false,
            locale: 'is',
            margin: { item : { horizontal : 0 } }
        };

        timeline = new vis.Timeline(timelineContainer, items, options);

        timeline.on('select', (properties) => {
            if (properties.items.length > 0) {
                const selectedItemId = properties.items[0];
                const selectedEvent = allEvents.find(event => event.id === selectedItemId);
                if (selectedEvent) {
                    showModal(selectedEvent, 'event');
                }
            }
        });
    }

    function renderCharacters() {
        if (!allCharacters.length || !charactersListContainer) return;

        charactersListContainer.innerHTML = '';
        const ul = document.createElement('ul');

        allCharacters.sort((a, b) => a.name.localeCompare(b.name, 'is'));

        allCharacters.forEach(character => {
            const li = document.createElement('li');
            li.textContent = character.name;
            li.setAttribute('data-char-name', character.name);
            li.addEventListener('click', () => showModal(character, 'character'));
            ul.appendChild(li);
        });
        charactersListContainer.appendChild(ul);
    }

    function renderFamilyTree() {
        if (!allFamilyTree.length || !familyTreeContainer) return;

        familyTreeContainer.innerHTML = '';
        familyTreeContainer.style.display = 'flex';
        familyTreeContainer.style.flexWrap = 'wrap';
        familyTreeContainer.style.gap = '1rem';

        allFamilyTree.forEach(person => {
            const card = document.createElement('div');
            card.style.border = '1px solid #ccc';
            card.style.padding = '1rem';
            card.style.borderRadius = '8px';
            card.style.width = '250px';
            card.style.boxShadow = '2px 2px 6px rgba(0,0,0,0.1)';
            card.style.background = '#fff';
            card.style.fontFamily = 'Georgia, serif';

            const title = `<h3>${person.name}</h3>`;
            const parents = person.parents?.length ? `<p><strong>Foreldrar:</strong> ${person.parents.join(' og ')}</p>` : '';
            const spouse = person.spouse ? `<p><strong>Maki:</strong> ${Array.isArray(person.spouse) ? person.spouse.join(', ') : person.spouse}</p>` : '';
            const children = person.children?.length ? `<p><strong>Börn:</strong> ${person.children.join(', ')}</p>` : '';

            card.innerHTML = `${title}${parents}${spouse}${children}`;
            familyTreeContainer.appendChild(card);
        });
    }

    function renderLocations() {
        if (!allLocations.length || !locationsListContainer) return;

        locationsListContainer.innerHTML = '';
        const ul = document.createElement('ul');

        allLocations.sort((a, b) => a.name.localeCompare(b.name, 'is'));

        allLocations.forEach(location => {
            const li = document.createElement('li');
            li.textContent = location.name;
            li.setAttribute('data-loc-name', location.name);
            li.addEventListener('click', () => showModal(location, 'location'));
            ul.appendChild(li);
        });
        locationsListContainer.appendChild(ul);
    }

    function showModal(data, type) {
        if (!data) return;

        modalTitle.textContent = '';
        modalBody.innerHTML = '';

        if (type === 'event') {
            modalTitle.textContent = `${data.title} (${data.year})`;
            let bodyContent = `<p>${data.summary}</p>`;
            if (data.location) bodyContent += `<h4>Staðsetning:</h4><p>${data.location}</p>`;
            if (data.characters?.length) {
                bodyContent += `<h4>Persónur:</h4><ul>`;
                data.characters.forEach(char => bodyContent += `<li>${char}</li>`);
                bodyContent += `</ul>`;
            }
            if (data.tags?.length) {
                bodyContent += `<h4 class="tags">Stikkorð:</h4><p>`;
                data.tags.forEach(tag => bodyContent += `<span>${tag}</span>`);
                bodyContent += `</p>`;
            }
            modalBody.innerHTML = bodyContent;

        } else if (type === 'character') {
            modalTitle.textContent = data.name;
            let bodyContent = `<p>${data.description}</p>`;
            bodyContent += `<h4>Tímabil:</h4><p>Kemur fyrst fyrir um ${data.first_appearance}, síðast um ${data.last_appearance}.</p>`;
            if (data.relations?.length) {
                bodyContent += `<h4>Tengsl:</h4><ul>`;
                data.relations.forEach(rel => bodyContent += `<li>${capitalizeFirstLetter(rel.type)}: ${rel.name}</li>`);
                bodyContent += `</ul>`;
            }
            if (data.related_events?.length) {
                bodyContent += `<h4>Tengdir atburðir:</h4><ul>`;
                data.related_events.forEach(eventId => {
                    const event = allEvents.find(e => e.id === eventId);
                    bodyContent += `<li>${event ? `${event.title} (${event.year})` : `Atburður #${eventId} (fannst ekki)`}</li>`;
                });
                bodyContent += `</ul>`;
            }
            modalBody.innerHTML = bodyContent;

        } else if (type === 'location') {
            modalTitle.textContent = data.name;
            let bodyContent = `<p>${data.description}</p>`;
            if (data.related_events?.length) {
                bodyContent += `<h4>Tengdir atburðir:</h4><ul>`;
                data.related_events.forEach(eventId => {
                    const event = allEvents.find(e => e.id === eventId);
                    bodyContent += `<li>${event ? `${event.title} (${event.year})` : `Atburður #${eventId} (fannst ekki)`}</li>`;
                });
                bodyContent += `</ul>`;
            }
            modalBody.innerHTML = bodyContent;
        }

        modal.style.display = 'block';
    }

    closeButton.onclick = () => modal.style.display = 'none';

    window.onclick = (event) => {
        if (event.target == modal) modal.style.display = 'none';
    }

    function capitalizeFirstLetter(string) {
        return string ? string.charAt(0).toUpperCase() + string.slice(1) : '';
    }

    loadData();
});
