// public/js/main.js

/**
 * Toggles the visibility of a form element and its corresponding button.
 * @param {string} formId The ID of the form element to toggle.
 */
function toggleForm(formId) {
    const formElement = document.getElementById(formId);
    if (formElement) {
        const isActive = formElement.classList.contains('active');
        if (isActive) {
            // Hide the form
            formElement.style.maxHeight = '0';
            formElement.style.opacity = '0';
            // Use setTimeout to wait for transition before setting display: none
            setTimeout(() => {
                 if (!formElement.classList.contains('active')) { // Check again in case toggled quickly
                    formElement.classList.remove('active'); // Ensure display: block is removed
                 }
            }, 500); // Match transition duration
             formElement.classList.remove('active'); // Start transition immediately
        } else {
            // Show the form
             formElement.classList.add('active'); // Set display: block and start transition
             // Set max-height after a short delay to allow display: block to take effect
             setTimeout(() => {
                 formElement.style.maxHeight = formElement.scrollHeight + 'px'; // Expand to content height
                 formElement.style.opacity = '1';
             }, 10); // Small delay
        }
    }
}

/**
 * Sets up event listeners for buttons that toggle forms.
 * @param {string} buttonId The ID of the button.
 * @param {string} formId The ID of the form to toggle.
 */
function setupFormToggleButton(buttonId, formId) {
    const buttonElement = document.getElementById(buttonId);
    if (buttonElement) {
        buttonElement.addEventListener('click', () => {
            toggleForm(formId);
        });
    }
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // Setup toggle buttons for insert forms
    setupFormToggleButton('btn-show-add-warehouse', 'form-add-warehouse');
    setupFormToggleButton('btn-show-add-supplier', 'form-add-supplier');
    setupFormToggleButton('btn-show-add-inventory', 'form-add-inventory');
    setupFormToggleButton('btn-show-add-product-type', 'form-add-product-type');

    // Handle search form submission
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent default form submission

            const formData = new FormData(searchForm);
            const queryParams = new URLSearchParams(formData).toString();
            const url = `/inventory/search?${queryParams}`;

            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'text/html'
                    }
                });
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const html = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const newSearchResults = doc.querySelector('#search-results');
                if (newSearchResults) {
                    document.querySelector('#search-results').innerHTML = newSearchResults.innerHTML;
                }
            } catch (error) {
                console.error('Error fetching search results:', error);
                document.querySelector('#search-results').innerHTML = '<p class="text-gray-400 text-center py-4">Error loading search results. Please try again.</p>';
            }
        });
    }
});

// --- Action Specific Functions ---

/**
 * Placeholder for confirming product deletion.
 * @param {HTMLFormElement} form The form being submitted.
 * @returns {boolean} True to allow submission, False to cancel.
 */
function confirmProductDelete(form) {
    const sku = form.elements['sku'].value;
    if (!sku) {
        alert('Please enter the SKU of the product to delete.');
        return false;
    }
    const confirmation = confirm(`Are you sure you want to delete product with SKU: ${sku}? \nThis will remove the product type and ALL its stock records if no transaction history exists. This action cannot be undone.`);
    return confirmation; // true if OK clicked, false if Cancel clicked
}

/**
 * Shows the update quantity form and pre-fills it.
 * @param {number} inventoryId The ID of the inventory item.
 * @param {number} currentQuantity The current quantity.
 */
function showUpdateForm(inventoryId, currentQuantity) {
    const formElement = document.getElementById('form-update-quantity');
    const inventoryIdInput = document.getElementById('updateInventoryId');
    const currentQuantityDisplay = document.getElementById('updateCurrentQuantity');
    const newQuantityInput = document.getElementById('updateNewQuantity');
     const itemIdentifierDisplay = document.getElementById('updateItemIdentifier'); // You might need more info here

    if (formElement && inventoryIdInput && currentQuantityDisplay && newQuantityInput && itemIdentifierDisplay) {
        inventoryIdInput.value = inventoryId;
        currentQuantityDisplay.textContent = currentQuantity;
        newQuantityInput.value = currentQuantity; // Pre-fill with current quantity
        itemIdentifierDisplay.textContent = `Inventory ID ${inventoryId}`; // Update this if you pass more data

        // Ensure form is visible
        if (!formElement.classList.contains('active')) {
            toggleForm('form-update-quantity');
        }
        // Scroll to the form for better visibility
        formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        newQuantityInput.focus(); // Focus the input field
    } else {
        console.error('Update form elements not found!');
    }
}