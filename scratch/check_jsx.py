import sys

def check_jsx_balance(filename):
    with open(filename, 'r') as f:
        content = f.read()
    
    stack = []
    line_num = 1
    for i, char in enumerate(content):
        if char == '\n':
            line_num += 1
        
        if content[i:i+1] == '<' and content[i+1:i+2] != '/' and content[i+1:i+2] != '!':
            # Possible start tag
            end_bracket = content.find('>', i)
            if end_bracket != -1:
                tag_content = content[i+1:end_bracket].strip()
                if not tag_content.endswith('/') and not tag_content.startswith('input') and not tag_content.startswith('img') and not tag_content.startswith('br'):
                    tag_name = tag_content.split()[0]
                    stack.append((tag_name, line_num))
        elif content[i:i+2] == '</':
            # End tag
            end_bracket = content.find('>', i)
            if end_bracket != -1:
                tag_name = content[i+2:end_bracket].strip()
                if stack:
                    last_tag, last_line = stack.pop()
                    if last_tag != tag_name:
                        print(f"Error: Expected </{last_tag}> (from line {last_line}), but found </{tag_name}> at line {line_num}")
                else:
                    print(f"Error: Unexpected </{tag_name}> at line {line_num}")

    if stack:
        for tag, line in stack:
            print(f"Error: Unclosed tag <{tag}> from line {line}")

if __name__ == "__main__":
    check_jsx_balance(sys.argv[1])
