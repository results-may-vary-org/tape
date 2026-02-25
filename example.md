# Heading 1

## Heading 2

### Heading 3

#### Heading 4

##### Heading 5

###### Heading 6

---

## Text Formatting

Regular paragraph text. Lorem ipsum dolor sit amet, consectetur adipiscing elit.

**Bold text** and __also bold__

*Italic text* and _also italic_

***Bold and italic*** and ___also bold and italic___

~~Strikethrough text~~

`Inline code`

> Blockquote text
> that spans multiple lines

> Nested blockquote
>> Second level
>>> Third level

---

## Lists

### Unordered List

- Item one
- Item two
  - Nested item
  - Another nested item
    - Deeply nested item
- Item three

### Ordered List

1. First item
2. Second item
   1. Nested ordered item
   2. Another nested ordered item
3. Third item

### Task List

- [x] Completed task
- [ ] Pending task
- [x] Another completed task
- [ ] Another pending task

---

## Code

Inline code: `const greeting = "Hello, World!"`

```javascript
// JavaScript code block
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10)); // 55
```

```python
# Python code block
def greet(name: str) -> str:
    return f"Hello, {name}!"

print(greet("World"))
```

```bash
# Shell commands
echo "Hello, World!"
ls -la
cd /home/user
```

```bash noLineNumbers
# no line numbers
echo "Hello, World!"
ls -la
cd /home/user
```


```bash {3}
# outline line 3
echo "Hello, World!"
ls -la
cd /home/user
```

```bash {3} noLineNumbers
# outline line 3
echo "Hello, World!"
ls -la
cd /home/user
```

```diff
# diff
+ echo "Hello, World!"
- ls -la
cd /home/user
```

```diff noLineNumbers
# diff, no line numbers
+ echo "Hello, World!"
- ls -la
cd /home/user
```

> [!NOTE]
> This is a **note** callout — for general information.

> [!TIP]
> This is a **tip** callout — for helpful suggestions.

> [!IMPORTANT]
> This is an **important** callout — for critical information.

> [!WARNING]
> This is a **warning** callout — for potentially harmful actions.

> [!CAUTION]
> This is a **caution** callout — for actions with serious consequences.

---

## Links and Images

https://example.com

[Inline link](https://example.com)

[Link with title](https://example.com "Example Website")

[Reference link][ref]

[ref]: https://example.com "Reference"

![Alt text for image](https://via.placeholder.com/150 "Image title")

---

## Tables

| Name       | Age | City          |
| ---------- | --- | ------------- |
| Alice      | 30  | New York      |
| Bob        | 25  | Los Angeles   |
| Charlie    | 35  | Chicago       |

| Left aligned | Center aligned | Right aligned |
| :----------- | :------------: | ------------: |
| Left         | Center         | Right         |
| Text         | Text           | Text          |

---

## Horizontal Rules

---

***

___

---

## Footnotes

Here is a sentence with a footnote.[^1]

Another sentence with a footnote.[^note]

[^1]: This is the first footnote.
[^note]: This is a named footnote.


---

## Escape Characters

\*Not italic\* \*\*Not bold\*\*

Backslash: \\

