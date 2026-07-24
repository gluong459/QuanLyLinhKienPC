const fs = require('fs');

function processFile(jsonFile, outFile) {
    try {
        let raw = fs.readFileSync(jsonFile);
        
        let text = "";
        if (raw[0] === 0xff && raw[1] === 0xfe) {
            text = raw.toString('utf16le');
        } else {
            text = raw.toString('utf8');
        }

        let data = JSON.parse(text);
        let content = data.content || '';
        
        // Remove prefixes
        let lines = content.split('\n');
        let cleanLines = [];
        let startParsing = false;
        
        for (let line of lines) {
            line = line.replace('\r', '');
            if (/^\d+:/.test(line)) {
                startParsing = true;
            }
            if (startParsing) {
                let m = line.match(/^\d+:\s?(.*)$/);
                if (m) {
                    cleanLines.push(m[1]);
                } else {
                    if (!line.includes('The above content shows the entire') && !line.includes('The above content does NOT show')) {
                        cleanLines.push(line);
                    }
                }
            }
        }
        
        let finalContent = cleanLines.join('\n');
        
        // Fix Vietnamese encoding errors mapping specifically for these files
        finalContent = finalContent.replace(/Linh ki\?n/g, 'Linh kiện');
        finalContent = finalContent.replace(/ThuTc/g, 'Thuộc');
        finalContent = finalContent.replace(/Th'ng kê/g, 'Thống kê');
        finalContent = finalContent.replace(/Đ\.i giao di\?n/g, 'Đổi giao diện');
        finalContent = finalContent.replace(/Khách hàng/g, 'Khách hàng');
        finalContent = finalContent.replace(/Đơn hàng/g, 'Đơn hàng');
        // Let's also do generic replacements for typical ISO-8859-1 errors if any:
        finalContent = finalContent.replace(/Quản lý Linh ki\?n/g, 'Quản lý Linh kiện');
        finalContent = finalContent.replace(/Loại linh ki\?n/g, 'Loại linh kiện');
        finalContent = finalContent.replace(/Quản lý ThuTc tính/g, 'Quản lý Thuộc tính');
        
        // For general safety, try to parse via buffer if it's still mangled, but let's just use the above
        let buf = Buffer.from(finalContent, 'utf8');
        let fixed = buf.toString('utf8');
        
        // Actually, the issue was powershell writing out bad text. Node.js might parse it perfectly because the JSON string contains valid \u escapes or unicode characters!
        
        fs.writeFileSync(outFile, finalContent, 'utf8');
        console.log("Restored " + outFile);
    } catch(e) {
        console.error("Error on " + jsonFile, e);
    }
}

processFile('admin_html_step.json', 'index.html');
processFile('admin_css_step.json', 'style.css');
processFile('admin_js_step.json', 'admin.js');
