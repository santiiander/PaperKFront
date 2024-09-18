// Add hover effect to social links
document.querySelectorAll('.social-link').forEach(link => {
    link.addEventListener('mouseenter', () => {
        link.style.transform = 'scale(1.1)';
    });
    link.addEventListener('mouseleave', () => {
        link.style.transform = 'scale(1)';
    });
});

// Add click effect to back button
const backButton = document.querySelector('.back-button');
backButton.addEventListener('mousedown', () => {
    backButton.style.transform = 'scale(0.95)';
});
backButton.addEventListener('mouseup', () => {
    backButton.style.transform = 'scale(1)';
});
backButton.addEventListener('mouseleave', () => {
    backButton.style.transform = 'scale(1)';
});