### ***HTML NOTES***



A status code of 200 means ok(accepted)



***NOTE;*** Do not write code elements in head, head is used to define the information and meta data on a page



<!DOCTYPE html> = used to define the doctype



<html></html> = opening and closing



<head></head> = Used to give  the browser info on about the page



<title></title> = Used to give the title of a page



&nbsp;<p></p> = means paragraph used to write down a text (it is a block element used to start out a new line, should not be used inline)



img = used to imply an image file



src = source, is followed by the file where images are stored and then the name of the image eg: 

&nbsp;                    <img src="images/picture.png">



{  } = in it we write our css code / declaration



width: = a declaration used to define width of an image (always follow with a column) eg: width:. \[100px is used to imply no. of pixels (100 is no. and px stands for pixels)] eg: img {width: 100px}



; = used to end a declaration so multiple declarations can be made in the same curly brackets.



border-radius: = a declaration used to setup border radius in a picture (used to round out edges in an image) also used with px. NOTE: If border radius is half of the image you'll get a round image



float: = defines the position of the image eg: float: left; moves the image to the left



margin: = used to put space between the image and following text eg: margin-right: 10px; is used to put 10 pixels between text and image



font-weight: = used to give font to text, eg of use: p {font-weight: bold;}



<p class = "info"> = is used to specify where a rule applies eg:  <p class ="header">ROLLS ROYCE</p>



The class tag is used to specify a particular code to be edited using css



## ***ADVANCED*** 

META ELEMENTS: These are used to define meta data



<meta charset> = used to define the character set to be used eg: ASCII, eg of use; <meta charset="UTF-8">. This defines the character set to be used as UTF (computers don't understand characters like "A,B,C" so we use numbers to rep them.



<meta name="viewport" content="width=device-width"> = used to define viewport (The viewport is the visible area of a webpage) we can use it to define the width and zoom factor of the viewport. \[used so that the webpage will be cropped into the appropriate size across all devices]



<meta name="keywords" content="HTML, CSS"> = used to define keywords on a webpage so that it comes up fast on a search.



<meta name="description" content="..."> = Used to display the description of a website when it pops up on a website.



<em> = used to emphasize a text



color is used to give color (American spelling only)



<strong> and <em> = used to imply strong importance or urgency on its content (strong is used to imply strong importance and urgency while em is just used to stress or imply more but not as much as strong)



<b> and <i> = used to make bold and italic texts without implying importance on the browser.



<span> = used to wrap a text, to be edited        #an inline element used inside code (<p>)



<h1> to <h6> = used to define headings and have different sizes. <h1> to <h6> also go in order of importance with 1 being most important and 6 being the least. **DO NOT CHOOSE HEADING BASED ON SIZE BECAUSE SIZE CAN ALWAYS BE EDITED WITH CSS, ALWAYS CHOOSE BASED ON IMPORTANCE.** You can also have two of h1 elements but you should always have one so the search engine properly understands what the page understands to avoid confusing it.



***ENTITIES***



To display, greater than (>) and less than (<) along with other entities, you use \&; with the entity you need between them eg: greater than = \&gt; and less than = \&lt;

The copyright symbol is \&copy;



***NOTE;*** To find more entities just google html entities, you won't use most so there is no need to cram them. 



<lorem"no. of words needed"> = is used to generate dummy text.



**Non breaking space;** This is used to ensure that a word stays together instead of it breaking into two with one on the first line and the other in the 2nd line. To do this *use "\&nbs;"* between the words.



***CREATING LINKS TO OTHER PAGES***

An anchor element (<a>) is used to link pages. To link to a new page the ancor element should have a hypertext reference eg; *<a href>*  eg in use: *<a href=""></a>* 



<a href="pg2.html"></a> is used when pages are in the same folder



<a href="More stuff/index.html"></a>      for a different folder



You can use both text and image to make a link



**../**  is used to go one level up,                         **../../ =** is used to go two levels up               **../../../ =** is used to go three levels up etc. if this has too many folders it would become messy and in which case we would use an absolute url. EG: 



##### <a href="/pg1.html">Home</a> (/ is used to go to the root of the page)



use *download* to add the download element so an imahe can be downloaded



id = used to give a unique identifier

link to a header in the same page:



***TO LINK AN EXTERNAL WEBSITE***

you use an absolute anchor eg: ***<a href="https//google.com">Go to google</a>***



**TO OPEN IN NEW TAB**

***<a href="https//google.com" target="\_blank">Go to google</a>***



**FOR EMAIL**

***<a href="mailto:ominabowan@gmail.com">email me</a>***



***NOTE; use short descriptive names for images so search engines finds them better.***



object-fit: cover; = helps image fit properly into an orientation

<ul> = unordered list, used to write a list. to specify where each list item starts and ends use <li> for an ordered list use <ol>

<br> = used to insert a new line, no need to close the element

<!-- comment --> = used to leave a comment 


<audio src="audio.mp3" controls type="audio/mp3"></audio>

 <!-- syntax used to add audio-->

 <video src="video.mp4"> controls type="video/mp4" </video> <widht>= 400px <height>=500

 <table> = used to create a table
       <tr>  <!--used to create arow in a table-->
       <th>hhh</th> <!--used to specify table header-->
       </tr>
       <tr> <!--starts a new row-->
       <td>ppp</td> <!-- stands for table data-->
       </tr>
</table>

<table border="1"> <!--to add border to the table-->

<!--TO ADD FORM-->
<form>
   <label>first label</label>  <input name="first car">
</form>


<button></button> <!--used to create a button-->