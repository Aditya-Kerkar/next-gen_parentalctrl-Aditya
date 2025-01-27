document.addEventListener('DOMContentLoaded', function() {
    const submitButton = document.getElementById('submit-request');
    const descriptionInput = document.getElementById('description');

    submitButton.addEventListener('click', submitRequest);

    async function submitRequest() {
        const description = descriptionInput.value;
        const urlParams = new URLSearchParams(window.location.search);
        const url = urlParams.get('blocked');
        
        if (!description.trim()) {
            showMessage('Please provide a reason for your request.', 'error');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/revocation-request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url, description })
            });

            if (response.ok) {
                showMessage('Your request has been submitted successfully!', 'success');
                descriptionInput.value = '';
            } else {
                showMessage('There was an error submitting your request.', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage('There was an error connecting to the server.', 'error');
        }
    }

    function showMessage(text, type) {
        const messageDiv = document.getElementById('message');
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
        
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
});