Для запуска требуется gulp версии 4.0.0 или выше<br/>
Туториал по обновлению https://www.liquidlight.co.uk/blog/article/how-do-i-update-to-gulp-4/

##Структура сборки
src<br/>
--assets //содержит статичный файлы и папки, не подвергающиеся трансформации</span><br/>
----fonts<br/>
--img<br/>
--css<br/>
----components<br/>
----main.css<br/>
--js<br/>
----components<br/>
----vendor<br/>
----main.js<br/>
--svg<br/>

В результате сборки генерируется папка build<br/>
build<br/>
--assets // копия src/assets<br/>
----fonts<br/>
--img //сжатые изображения<br/>
----svg /содержит svg-спрайт
--css<br/>
----main.css //скомпилированный css файл<br/>
--js<br/>
----vendor //копия src/js/vendor<br/>
----main.js //выплевывается webpack`ом<br/>
----svg-lib.js //содержит символы svg из src/svg<br/>

##Таски
```gulp clean``` - удаление папки build<br/>
```gulp build``` - сначала запускается clean, затем таски по сборке проекта<br/>
```gulp webserver``` - запускает browsersync<br/>
```gulp sassdoc``` - генерирует документацию к sass (аннотация http://sassdoc.com/annotations/)<br/>
и другие, детали в gulpfile.js<br/>


##Режим разработки<br/>
команда ```gulp```<br/>
пересоздается папка build, запускается вотчер и вебсервер<br/>

##Сборка для продакшена<br/>
команда ```NODE_ENV=prod gulp```<br/>
Пересоздается папка build<br/>
В этом режиме не создается sourcemap, сжимается css<br/>
