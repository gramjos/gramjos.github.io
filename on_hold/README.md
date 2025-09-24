Create the file structure.
```python
python parse/src/main.py [path]
```
The above command outputs a directory.

TODO: in `js/app.js`, traverse the file structure `try_hosting_Vault_ready_2_serve` with `file_structure.json`. Create a web of interconnected, static web pages. 

#### Recursive display pattern
_use th README.html as landing pages that link files or directories (which are README.md files acting the like the homepage)._
Serving steps:
1.  Find the nearest README.html. This is the websites home page (landing page).
2. Next, handle the rest of the items in the same directory.  For the rest of the HTML filess, create hyperlinks to navigate to their page. For the rest of the directories, create hyper leaks to navigate to their landing page. Their landing page is their own README.html