# Code Snippet Tests

## Regular Python Snippet

```python
def hello_world():
    print("Hello, World!")
```

## Run-Python Snippet

```run-python
from typing import List

def findPrime(N) -> List[int] :
	for i in range(1, int(N**(0.5))):
		if N%i==0: print(i)
	return [1,2]

print(findPrime(78))
```

## Run-JavaScript Snippet

```run-javascript
function greet(name) {
    console.log(`Hello, ${name}!`);
}
greet("World");
```

## Regular JavaScript Snippet

```javascript
const add = (a, b) => a + b;
console.log(add(2, 3));
```
