$url = "https://script.google.com/macros/s/AKfycbyVA2cEhKV7MuaepzA5oMWiSpNlW5juIbfU-hR11HWt5rJQTk1tVhfJR9geKBfLGZNn/exec"

$body = @{
    action = "add"
    bookId = "test1"
    book = @{
        bookId = "test1"
        bookName = "TestBook"
        author = "TestAuthor"
        publicer = "TestPublisher"
        category = "BookType"
        tag = "test"
        addDate = "2026-07-13"
    }
    management = @{
        No = ""
        bookId = "test1"
        progress = "50"
        status = "reading"
        rating = "4"
        notes = "test notes"
        modDate = "2026-07-13"
    }
} | ConvertTo-Json -Depth 5

Write-Output "Sending:"
Write-Output $body

try {
    $result = Invoke-RestMethod -Uri $url -Method POST -Body $body -ContentType "application/json" -MaximumRedirection 10
    Write-Output "Response:"
    $result | ConvertTo-Json
} catch {
    Write-Output "Error: $($_.Exception.Message)"
}
