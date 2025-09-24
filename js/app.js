//Directory of HTML files to be served
const root = "../try_hosting_Vault_ready_2_serve"; 

// iterate thru the `root` and print the all the file names 
function listFiles(dir, container) {
    const ul = document.createElement('ul');
    for (const item of dir) {
        const li = document.createElement('li');
        if (item.type === 'directory') {
            li.textContent = item.name;
            if (item.children) {
                listFiles(item.children, li);
            }
        } else {
            const a = document.createElement('a');
            a.textContent = item.name;
            a.href = `${root}/${item.path}`;
            li.appendChild(a);
        }
        ul.appendChild(li);
    }
    container.appendChild(ul);
}

fetch(`${root}/file_structure.json`)
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        const container = document.querySelector('.landing_page_content');
        if (container) {
            listFiles(data, container);
        } else {
            console.error('Could not find element with class "landing_page_content"');
        }
    })
    .catch(error => console.error('Error fetching or processing file structure:', error));
