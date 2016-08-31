ymaps.ready(init);

function init() {

//Инициализация переменных

	let myMap = new ymaps.Map("map", {
								center: [59.95, 30.33],
								zoom: 11
							});

	let body = document.getElementsByTagName('body')[0];

	let balloonLayout = ymaps.templateLayoutFactory.createClass('\
		<div class="balloon-container">\
			<div id="closeBalloon" style="float: right; cursor: pointer;" >X</div>\
			<div id="address" style="float: left"></div></br>\
			</br><div id="reviews" data-content=0></div></br>\
			<input type="text" class="field" id="name" placeholder="name">\
			<input type="text" class="field" id="place" placeholder="place">\
			<input type="text" class="field" id="comment" placeholder="comment">\
			<button id="submit">submit</button>\
		</div>');

	let clustererLayout = ymaps.templateLayoutFactory.createClass(
		'<h2 class=ballon_header> {{properties.place|raw}}</h2>' +
		'<div class=ballon_body>' +
			'<a href="#" id="addressCarousel">{{properties.address|raw}}</a></br>' +
			'{{properties.review|raw}}' +
		'</div>' +
		'<div class=ballon_footer>{{properties.date|raw}}</div>');

	let myClusterer = new ymaps.Clusterer({
		clusterDisableClickZoom: true,
		clusterBalloonContentLayout: 'cluster#balloonCarousel',
		clusterBalloonItemContentLayout: clustererLayout,
		clusterBalloonPanelMaxMapArea: 0,
		clusterBalloonContentLayoutWidth: 200,
		clusterBalloonContentLayoutHeight: 130,
		clusterBalloonPagerSize: 5
	});
	myMap.geoObjects.add(myClusterer);

	let balloon, coords;
	let reviews = {};

	//Инициализация функций

	function showBalloon(e) {

		coords = e.get('coords');
		if(balloon) balloon.close();
		openBalloon();
	};

	function openBalloon(needReviews) {
    if(needReviews) coords = reviews[needReviews][0].coords;
		balloon = getBalloon();

		balloon.open(coords).then(()=>{
			getAddress();
			document.getElementById('closeBalloon').addEventListener('click', ()=>{
				balloon.close();
			});
			document.getElementById('submit').addEventListener('click', addReview);
      if(needReviews) {
        showReviews(needReviews);
      }
		});
	};

	function setPlacemark(coords, data) {
		let myPlacemark = getPlacemark(coords, data);
		myMap.geoObjects.add(myPlacemark);
		myClusterer.add(myPlacemark);
	};

	function addReview(e) {
		let name = document.getElementById('name');
		let place = document.getElementById('place');
		let review = document.getElementById('comment');

		if(name.value || place.value || comment.value) {

			let data = {
				name:name.value,
				review:review.value,
				date:getCurrentDate(),
				place:place.value,
				address: document.getElementById('address').innerHTML,
        coords: coords
			};
			pushToReviewList(data);
			setPlacemark(coords, data);
      showReviews(data.address);
		}
	};

	function pushToReviewList(data) {
		if(!reviews[data.address]) reviews[data.address] = [];
		reviews[data.address].push(data);
	};

	function showReviews(address) {
		let source = reviewTemplate.innerHTML;
		let tamplateFn = Handlebars.compile(source);
		let tamplate = tamplateFn({list: reviews[address]});
		document.getElementById('reviews').innerHTML = tamplate;
	};
//   function addReview(e) {
//     let name = document.getElementById('name');
//     let place = document.getElementById('place');
//     let comment = document.getElementById('comment');
//     let reviews = document.getElementById('reviews');

//     if(name.value || place.value || comment.value){
//       if(reviews.dataset.content === '0') reviews.innerHTML = '';
//       reviews.dataset.content = '1';
//       reviews.innerHTML += `${name.value} ${place.value} ${comment.value} ${getCurrentDate()} </br>`;
//       balloon.reviews = reviews.innerHTML;
//       setPlacemark(coords, balloon);
//     }
//   };

	function getPlacemark(markerCoords, data) {
		return new ymaps.Placemark(markerCoords, data, {
			openBalloonOnClick: false
		});
	};

	function getAddress() {
		ymaps.geocode([coords[0], coords[1]], {results: 1}).then( (res) => {
			document.getElementById('address').innerHTML = res.geoObjects.get(0).properties.get('text');
		},
		(rej) => {
			document.getElementById('adress').innerHTML = 'Address does not found'
		})
	};

	function getCurrentDate() {
		let time, day, month, year;
		time = new Date();
		day = time.getDate();
		month = time.getMonth()+1;
		year = time. getFullYear();
		if (day <=9) day = '0'+day;
		if (month <=9) month = '0'+month;
		return `${day}.${month}.${year}`;
	};

	function getBalloon() {
		let balloon = new ymaps.Balloon(myMap);
		balloon.options.setParent(myMap.options);
		balloon.options.set('layout', balloonLayout);
		return balloon;
	};

//Вешаем обработчики

	myMap.events.add('click', showBalloon);
	myClusterer.events.add('click', (e) => {
		balloon.close();
    balloon = myClusterer.balloon;
  });

  document.addEventListener('click', (e) => {
    if(e.target.getAttribute('id') === 'addressCarousel') {
      balloon.close();
      openBalloon(e.target.innerHTML);
    }
  });

  myMap.geoObjects.events.add('click', (e) => {
    balloon.close();
    openBalloon(e.get('target').properties.get('address'));
  });
};
