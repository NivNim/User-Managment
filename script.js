document.addEventListener('DOMContentLoaded', function() {
    var deleteButtons = document.querySelectorAll('.deleteBtn');
    deleteButtons.forEach(function(btn) {
        btn.addEventListener('click', function() {
            var userId = btn.getAttribute('data-id');
            fetch('/deleteUser/' + userId, {
                method: 'DELETE'
            })
            .then(response => {
                if (response.ok) {
                    btn.closest('tr').remove();
                } else {
                    console.error('Failed to delete user');
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
        });
    });
});