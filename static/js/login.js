

window.onload = () => {
    const aEls = document.querySelectorAll('form a')
    const formEls = document.querySelectorAll('form')
    aEls.forEach(aEl => {
        aEl.addEventListener('click', function(e) {
            e.preventDefault()
            formEls.forEach(formEl => {
                formEl.classList.toggle('isNone')
                formEl.querySelectorAll('input').forEach(inputEl => {
                    inputEl.value = ''
                })
            })
        })
    })

    formEls.forEach(formEl => {
        formEl.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(formEl);
            const response = await fetch(formEl.action, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(Object.fromEntries(formData.entries()))
            });
            
            if (response.ok) {
                const data = await response.json();
                if (!data.message) {
                    formEls.forEach(f => f.classList.toggle('isNone'));
                    formEl.querySelectorAll('input').forEach(inputEl => {
                        inputEl.value = '';
                    });
                } else {
                    // 서버로부터 메시지를 받아온 경우에만 alert 창 띄우기
                    alert(data.message);
                }
            } else {
                console.error('Error:', response.statusText);
            }
        });
    });
}