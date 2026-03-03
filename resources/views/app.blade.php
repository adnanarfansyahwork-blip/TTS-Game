<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Quiz GenZ ⚡</title>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
        href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&family=Inter:wght@400;700;900&display=swap"
        rel="stylesheet">

    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</head>

<body class="antialiased">
    <div class="bg-shapes">
        <div class="shape" style="width: 400px; height: 400px; top: -100px; left: -100px;"></div>
        <div class="shape" style="width: 300px; height: 300px; bottom: -50px; right: -50px; animation-delay: -5s;">
        </div>
        <div class="shape" style="width: 200px; height: 200px; top: 40%; right: 10%; animation-delay: -10s;"></div>
    </div>
    <div id="app"></div>
</body>

</html>