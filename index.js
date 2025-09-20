// Sample church data for search functionality
const churches = [
    { name: "Zetech University", code: "ZETU001" },
    { name: "Nairobi Central Church", code: "NCC002" },
    { name: "Karen Adventist Church", code: "KAC003" },
    { name: "Eastleigh SDA Church", code: "ESC004" },
    { name: "Kibera Community Church", code: "KCC005" },
    { name: "Westlands Baptist Church", code: "WBC006" },
    { name: "Kasarani Methodist Church", code: "KMC007" },
    { name: "Thika Road Chapel", code: "TRC008" },
    { name: "Langata Presbyterian", code: "LPC009" },
    { name: "Kiambu Town Church", code: "KTC010" }
];

let currentScreen = 1;
let selectedChurch = '';
let donationData = {};
let navigationHistory = [1];

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    loadStoredData();
    setupSearchFunctionality();
    setupBrowserNavigation();
    setupFormValidation();

    // Check hash on load
    const hash = window.location.hash;
    if (hash && /^#screen\d+$/.test(hash)) {
        const screenNum = parseInt(hash.replace('#screen', ''), 10);
        goToScreenDirect(screenNum);
    }
});

// Browser navigation support
function setupBrowserNavigation() {
    // Handle browser back/forward buttons
    window.addEventListener('popstate', function(event) {
        if (event.state && event.state.screen) {
            const targetScreen = event.state.screen;
            goToScreenDirect(targetScreen);
        }
    });

    // Handle manual hash change in URL
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash;
        if (hash && /^#screen\d+$/.test(hash)) {
            const screenNum = parseInt(hash.replace('#screen', ''), 10);
            goToScreenDirect(screenNum);
        }
    });

    // Set initial state
    history.replaceState({ screen: currentScreen }, '', `#screen${currentScreen}`);
}

// Search functionality
function setupSearchFunctionality() {
    const searchInput = document.getElementById('church-search');
    const searchResults = document.getElementById('search-results');

    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        if (query.length < 2) {
            searchResults.style.display = 'none';
            return;
        }

        const filtered = churches.filter(church =>
            church.name.toLowerCase().includes(query) ||
            church.code.toLowerCase().includes(query)
        );

        if (filtered.length > 0) {
            searchResults.innerHTML = filtered.map(church =>
                `<div class="search-result" onclick="selectChurch('${church.name}')">${church.name}</div>`
            ).join('');
            searchResults.style.display = 'block';
        } else {
            searchResults.style.display = 'none';
        }
    });

    // Hide results when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-container')) {
            searchResults.style.display = 'none';
        }
    });
}

function selectChurch(churchName) {
    selectedChurch = churchName;
    document.getElementById('church-search').value = churchName;
    document.getElementById('search-results').style.display = 'none';

    // Update church name in subsequent screens
    document.getElementById('selected-church').textContent = churchName;
    document.getElementById('receipt-church').textContent = churchName;
    document.getElementById('thankyou-church').textContent = churchName;

    // Automatically go to next screen after selection
    setTimeout(() => {
        goToScreen(2);
    }, 500);
}

function goToScreen(screenNumber) {
    if (screenNumber !== currentScreen) {
        navigationHistory.push(screenNumber);
        // Push state with hash in URL
        history.pushState({ screen: screenNumber }, '', `#screen${screenNumber}`);
    }
    goToScreenDirect(screenNumber);
}

function goToScreenDirect(screenNumber) {
    // Hide current screen
    const activeScreen = document.querySelector('.screen.active');
    if (activeScreen) activeScreen.classList.remove('active');

    // Show target screen
    const target = document.getElementById(`screen-${screenNumber}`);
    if (target) {
        target.classList.add('active');
        currentScreen = screenNumber;

        // Handle special cases
        if (screenNumber === 3) {
            generateReceiptSummary();
        }
        if (screenNumber === 2) {
            setTimeout(setupFormValidation, 100);
        }

        // Store state
        storeData();

        // Scroll to top of new screen
        target.scrollTop = 0;
    }
}

function generateReceiptSummary() {
    const form = document.getElementById('donation-form');
    const formData = new FormData(form);
    const summary = document.getElementById('receipt-summary');

    let total = 0;
    let summaryHTML = '';

    for (let [key, value] of formData.entries()) {
        if (value && value.trim() !== '') {
            const amount = parseFloat(value) || 0;
            total += amount;
            const displayName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            summaryHTML += `
                <div class="receipt-row">
                    <span>${displayName}</span>
                    <span>KES ${amount.toFixed(2)}</span>
                </div>
            `;
            donationData[key] = value;
        }
    }

    if (summaryHTML === '') {
        summaryHTML = `
            <div class="receipt-row">
                <span>No donations entered</span>
                <span>KES 0.00</span>
            </div>
        `;
    }

    summaryHTML += `
        <div class="receipt-row">
            <span>Total</span>
            <span>KES ${total.toFixed(2)}</span>
        </div>
    `;

    summary.innerHTML = summaryHTML;
    donationData.total = total;
}

function toggleExpandable() {
    const content = document.getElementById('expandable-content');
    const icon = document.querySelector('.expand-icon');
    const mainContent = document.getElementById('main-form-content');
    const formContainer = document.querySelector('#screen-2 .form-container');

    const isExpanded = content.classList.contains('expanded');
    
    if (!isExpanded) {
        // Show additional categories
        mainContent.classList.add('hidden');
        content.classList.add('expanded');
        icon.classList.add('rotated');
        
        // Scroll to top of form container smoothly
        setTimeout(() => {
            formContainer.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }, 100);
        
    } else {
        // Show main categories
        content.classList.remove('expanded');
        mainContent.classList.remove('hidden');
        icon.classList.remove('rotated');
        
        // Scroll to top of form container smoothly
        setTimeout(() => {
            formContainer.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }, 100);
    }

    // Re-validate form after expanding/collapsing
    setTimeout(setupFormValidation, 100);
}

function setupFormValidation() {
    // Add any form validation logic here
}

async function submitDonation(event) {
    const receiptForm = document.getElementById('receipt-form');
    const formData = new FormData(receiptForm);

    // Validate required fields
    let isValid = true;
    for (let [key, value] of formData.entries()) {
        if (!value.trim()) {
            isValid = false;
            break;
        }
    }

    if (!isValid) {
        alert('Please fill in all required fields');
        return;
    }

    // Check if there are any donations
    if (!donationData.total || donationData.total === 0) {
        alert('Please add at least one donation amount');
        goToScreen(2);
        return;
    }

    // Prepare final data
    const finalData = {
        church: selectedChurch,
        donations: donationData,
        receipt_details: {
            full_name: formData.get('full_name'),
            church_member: formData.get('church_member'),
            mpesa_number: formData.get('mpesa_number')
        },
        timestamp: new Date().toISOString()
    };

    // Show loading state
    const submitBtn = event.target;
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<div class="spinner"></div>';
    submitBtn.classList.add('loading');

    goToScreen(4);
}

function startOver() {
    clearStoredData();
    currentScreen = 1;
    selectedChurch = '';
    donationData = {};
    navigationHistory = [1];

    // Reset forms
    document.getElementById('donation-form').reset();
    document.getElementById('receipt-form').reset();
    document.getElementById('church-search').value = '';

    // Reset expandable sections
    const expandableContent = document.getElementById('expandable-content');
    const expandIcon = document.querySelector('.expand-icon');
    const mainContent = document.getElementById('main-form-content');
    
    if (expandableContent && expandIcon && mainContent) {
        expandableContent.classList.remove('expanded');
        mainContent.classList.remove('hidden');
        expandIcon.classList.remove('rotated');
    }

    // Go to first screen
    document.querySelector('.screen.active').classList.remove('active');
    document.getElementById('screen-1').classList.add('active');

    // Reset browser history
    history.replaceState({ screen: 1 }, '', '#screen1');
}

function reportIssue() {
    alert('Issue reporting functionality would be implemented soon. Please contact support at momanyimdavid@gmail.com');
}

// Local storage functions (using memory instead of localStorage)
function storeData() {
    const data = {
        currentScreen,
        selectedChurch,
        donationData,
        navigationHistory,
        timestamp: Date.now()
    };
    window.appData = data;
}

function loadStoredData() {
    const data = window.appData;
    if (data && (Date.now() - data.timestamp) < 3600000) { // 1 hour expiry
        currentScreen = data.currentScreen;
        selectedChurch = data.selectedChurch;
        donationData = data.donationData;
        navigationHistory = data.navigationHistory || [1];

        if (selectedChurch) {
            document.getElementById('selected-church').textContent = selectedChurch;
            document.getElementById('receipt-church').textContent = selectedChurch;
            document.getElementById('thankyou-church').textContent = selectedChurch;
            document.getElementById('church-search').value = selectedChurch;
        }

        // Go to stored screen
        if (currentScreen !== 1) {
            document.querySelector('.screen.active').classList.remove('active');
            document.getElementById(`screen-${currentScreen}`).classList.add('active');
        }
    }
}

function clearStoredData() {
    window.appData = null;
}

// Handle touch events for better mobile experience
document.addEventListener('touchstart', function() {}, { passive: true });
document.addEventListener('touchmove', function() {}, { passive: true });

// Prevent zoom on double tap for better UX
let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Force repaint on orientation change for mobile browsers
window.addEventListener('orientationchange', function() {
    setTimeout(function() {
        window.scrollTo(0, 1);
        window.scrollTo(0, 0);
    }, 500);
});