<script>
			(function() {
				const musicEl = document.getElementById('bg-music');
				const musicIframe = document.getElementById('music-iframe');
				const musicWrap = document.getElementById('music-embed-wrap');
				const musicToggle = document.getElementById('bg-music-toggle');
				let musicOn = false;
				function iframeSetAutoplay(on) {
					if (!musicIframe) return;
					const base = 'https://vocaroo.com/embed/1gZWRLNooN4U?autoplay=';
					musicIframe.src = base + (on ? '1' : '0');
				}
				if (musicEl) {
					musicEl.volume = 0.08;
				}
				function startMusic() {
					if (musicIframe && musicWrap) {
						iframeSetAutoplay(true);
						musicOn = true;
						return;
					}
					if (musicEl) {
						musicEl.play().catch(() => {});
						musicOn = true;
					}
				}
				function stopMusic() {
					if (musicIframe && musicWrap) {
						iframeSetAutoplay(false);
						musicOn = false;
						return;
					}
					if (musicEl) {
						musicEl.pause();
						musicOn = false;
					}
				}
				const tryStartOnce = () => { if (!musicOn) startMusic(); window.removeEventListener('pointerdown', tryStartOnce); };
				window.addEventListener('pointerdown', tryStartOnce, { once: true });
				if (musicToggle) {
					musicToggle.addEventListener('click', () => {
						if (musicOn) {
							stopMusic();
							musicToggle.style.opacity = '0.5';
						} else {
							startMusic();
							musicToggle.style.opacity = '0.85';
						}
					});
				}
				const formatPriceForCube = (price) => `${new Intl.NumberFormat('tr-TR').format(price)} TL`;
				function openCubePopup(product) {
					const modal = document.getElementById('product-popup');
					if (!modal) {
						console.error("3D KÜP HATASI: 'product-popup' ID'li modal bulunamadı.");
						window.open(product.link, '_blank');
						return;
					}
					const titleBar = document.getElementById('popup-title-bar');
					const brand = document.getElementById('popup-brand');
					const title = document.getElementById('popup-title');
					const oldPrice = document.getElementById('popup-old-price');
					const newPrice = document.getElementById('popup-new-price');
					const image = document.getElementById('popup-image');
					const link = document.getElementById('popup-link-details');
					const brokenGlass = document.getElementById('broken-glass-overlay');
					const content = document.getElementById('popup-content');
					if (brokenGlass) brokenGlass.classList.add('hidden');
					if (content) content.classList.remove('hidden-content');
					[brand, title, oldPrice, newPrice, link, image].forEach(el => { if(el) el.style.visibility = 'visible'; });
					if (titleBar) titleBar.innerText = product.brand || 'Ürün Detayı';
					if (brand) brand.innerText = product.brand;
					if (title) title.innerText = product.name;
					if (oldPrice) oldPrice.innerText = formatPriceForCube(product.oldPrice);
					if (newPrice) newPrice.innerText = formatPriceForCube(product.newPrice);
					if (image) { image.src = product.image; image.alt = product.name; }
					if (link) { link.href = product.link; link.innerText = 'İncele'; }
					modal.classList.remove('hidden');
				}

				function initProductCube(containerId, productData) {
					const cubeContainer = document.getElementById(containerId);
					if (!cubeContainer) return;
					let scene, camera, renderer, cube, raycaster, pointer;
					let autoRotateY = 0.003;
					let autoRotateX = 0.0015;
					let isPointerDown = false;
					let isDragging = false;
					let pointerDownTime = 0;
					let pointerStart = { x: 0, y: 0 };
					let prevPointer = { x: 0, y: 0 };
					const maxClickDuration = 250;
					const maxClickMovement = 10;
					try {
						const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--color-window');
						const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--color-border');
						scene = new THREE.Scene();
						scene.background = null;
						camera = new THREE.PerspectiveCamera(50, cubeContainer.clientWidth / cubeContainer.clientHeight, 0.1, 1000);
						camera.position.set(3.8, 3.8, 3.8);
						camera.lookAt(scene.position);
                    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
                    renderer.outputEncoding = THREE.SRGBColorSpace ? THREE.SRGBColorSpace : THREE.sRGBEncoding;
                    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
                    renderer.setSize(cubeContainer.clientWidth, cubeContainer.clientHeight);
                    cubeContainer.appendChild(renderer.domElement);
                    const textureLoader = new THREE.TextureLoader();
                    const materials = [];
                    const maxAniso = renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 4;
                    productData.forEach((product) => {
                        const texture = textureLoader.load(product.image);
                        texture.minFilter = THREE.LinearFilter;
                        texture.magFilter = THREE.LinearFilter;
                        texture.encoding = THREE.SRGBColorSpace ? THREE.SRGBColorSpace : THREE.sRGBEncoding;
                        texture.anisotropy = maxAniso;
                        materials.push(new THREE.MeshBasicMaterial({ map: texture, color: 0xdddddd }));
                    });
                    const geometry = new THREE.BoxGeometry(3.2, 3.2, 3.2);
                    cube = new THREE.Mesh(geometry, materials);
                    scene.add(cube);
                    const edgesGeometry = new THREE.EdgesGeometry(geometry);
                    const edges = new THREE.LineSegments(edgesGeometry, new THREE.LineBasicMaterial({ color: borderColor || '#4E245E', linewidth: 3 }));
                    cube.add(edges);
                    raycaster = new THREE.Raycaster();
                    pointer = new THREE.Vector2();
                    function onResize() {
							camera.aspect = cubeContainer.clientWidth / cubeContainer.clientHeight;
							camera.updateProjectionMatrix();
							renderer.setSize(cubeContainer.clientWidth, cubeContainer.clientHeight);
						}
						function onDown(event) {
							isPointerDown = true; isDragging = false; pointerDownTime = Date.now();
							pointerStart = { x: event.clientX, y: event.clientY };
							prevPointer = { x: event.clientX, y: event.clientY };
							window.addEventListener('pointermove', onMove, false);
							window.addEventListener('pointerup', onUp, false);
							cubeContainer.classList.add('dragging');
						}
						function onMove(event) {
							if (!isPointerDown) return;
							const totalDeltaX = Math.abs(event.clientX - pointerStart.x);
							const totalDeltaY = Math.abs(event.clientY - pointerStart.y);
							if (!isDragging && (totalDeltaX > maxClickMovement || totalDeltaY > maxClickMovement)) isDragging = true;
							if (isDragging) {
								const deltaX = event.clientX - prevPointer.x;
								const deltaY = event.clientY - prevPointer.y;
								cube.rotation.y += deltaX * 0.005;
								cube.rotation.x += deltaY * 0.005;
							}
							prevPointer = { x: event.clientX, y: event.clientY };
						}
						function onUp(event) {
							isPointerDown = false; cubeContainer.classList.remove('dragging');
							window.removeEventListener('pointermove', onMove, false);
							window.removeEventListener('pointerup', onUp, false);
							const duration = Date.now() - pointerDownTime;
							if (!isDragging && duration < maxClickDuration) handleClick(event);
						}
						function handleClick(event) {
							const rect = renderer.domElement.getBoundingClientRect();
							pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
							pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
							raycaster.setFromCamera(pointer, camera);
							const intersects = raycaster.intersectObject(cube);
							if (intersects.length > 0) {
								const materialIndex = intersects[0].face.materialIndex;
								if (materialIndex >= 0 && materialIndex < productData.length) openCubePopup(productData[materialIndex]);
							}
						}
                    function animate() {
							requestAnimationFrame(animate);
                        if (!isPointerDown) { cube.rotation.y += autoRotateY; cube.rotation.x += autoRotateX; }
							renderer.render(scene, camera);
						}
                    window.addEventListener('resize', onResize);
                    cubeContainer.addEventListener('pointerdown', onDown, false);
                    animate();
					} catch (e) {
						console.error('3D Küp başlatılırken bir hata oluştu:', e);
						cubeContainer.style.display = 'none';
					}
				}

				// Küpler için sliderlardan rastgele ürünlerin rastgele varyantlarını seç
				const getRandomProductsFromSlider = (sliderId, count = 6) => {
					const slider = document.getElementById(sliderId);
					if (!slider) return [];
					
					const cards = slider.querySelectorAll('.product-card');
					const products = [];
					
					cards.forEach(card => {
						const variantsDataStr = card.getAttribute('data-variants');
						const imageEl = card.querySelector('.product-card__image');
						const titleEl = card.querySelector('.product-card__title');
						const brandEl = card.querySelector('.product-card__brand');
						const oldPriceEl = card.querySelector('.product-card__old-price');
						const newPriceEl = card.querySelector('.product-card__new-price');
						const linkEl = card.querySelector('.btn-pixel');
						
						if (!imageEl || !titleEl || !oldPriceEl || !newPriceEl || !linkEl) return;
						
						// Varyantlı ürünler için rastgele bir varyant seç
						if (variantsDataStr) {
							try {
								const variantsData = JSON.parse(variantsDataStr);
								const variants = variantsData.variants || [];
								if (variants.length > 0) {
									// Stoklu varyantları filtrele
									const inStockVariants = variants.filter(v => v.stock && v.stock > 0);
									const availableVariants = inStockVariants.length > 0 ? inStockVariants : variants;
									
									// Rastgele bir varyant seç
									const randomVariant = availableVariants[Math.floor(Math.random() * availableVariants.length)];
									
									const parsePrice = (priceText) => {
										const cleaned = priceText.replace(/[^\d]/g, '');
										return parseInt(cleaned, 10) || 0;
									};
									
									const oldPrice = randomVariant.oldPrice || parsePrice(oldPriceEl.textContent);
									const newPrice = randomVariant.newPrice || parsePrice(newPriceEl.textContent);
									
									if (oldPrice > 0 && newPrice > 0 && newPrice < oldPrice) {
										products.push({
											name: titleEl.textContent.trim(),
											brand: brandEl ? brandEl.textContent.trim() : '',
											image: randomVariant.image || imageEl.src,
											oldPrice: String(oldPrice),
											newPrice: String(newPrice),
											link: randomVariant.link || linkEl.href || linkEl.getAttribute('href') || ''
										});
									}
								}
							} catch (e) {
								console.error('Varyant verisi parse edilemedi:', e);
							}
						} else {
							// Varyantsız ürün
							const parsePrice = (priceText) => {
								const cleaned = priceText.replace(/[^\d]/g, '');
								return parseInt(cleaned, 10) || 0;
							};
							
							const oldPrice = parsePrice(oldPriceEl.textContent);
							const newPrice = parsePrice(newPriceEl.textContent);
							
							if (oldPrice > 0 && newPrice > 0 && newPrice < oldPrice) {
								products.push({
									name: titleEl.textContent.trim(),
									brand: brandEl ? brandEl.textContent.trim() : '',
									image: imageEl.src,
									oldPrice: String(oldPrice),
									newPrice: String(newPrice),
									link: linkEl.href || linkEl.getAttribute('href') || ''
								});
							}
						}
					});
					
					// Rastgele count kadar ürün seç
					if (products.length === 0) return [];
					const shuffled = [...products].sort(() => 0.5 - Math.random());
					return shuffled.slice(0, Math.min(count, products.length));
				};
				
				let dataMouse = [];
				let dataMousepad = [];
				let dataKlavye = [];
				
				const populateCubes = () => {
					// Sliderlardan ürünleri al
					dataMouse = getRandomProductsFromSlider('product-slider-mouse', 6);
					dataMousepad = getRandomProductsFromSlider('product-slider-mousepad', 6);
					dataKlavye = getRandomProductsFromSlider('product-slider-keyboard', 6);
					
					// Eğer ürünler yoksa, biraz bekleyip tekrar dene
					if ((dataMouse.length === 0 && dataMousepad.length === 0 && dataKlavye.length === 0)) {
						setTimeout(populateCubes, 500);
						return;
					}
					
					// Küpleri başlat
					const popup = document.getElementById('product-popup');
					const c1 = document.getElementById('product-cube-mouse');
					const c2 = document.getElementById('product-cube-klavye');
					const c3 = document.getElementById('product-cube-mousepad');
					
					if (popup && c1 && c2 && c3 && window.THREE) {
						// Mevcut küpleri temizle
						c1.innerHTML = '';
						c2.innerHTML = '';
						c3.innerHTML = '';
						
						if (dataMouse.length > 0) {
							initProductCube('product-cube-mouse', dataMouse);
						}
						if (dataKlavye.length > 0) {
							initProductCube('product-cube-klavye', dataKlavye);
						}
						if (dataMousepad.length > 0) {
							initProductCube('product-cube-mousepad', dataMousepad);
						}
					}
				};

				const startInterval = setInterval(() => {
					const popup = document.getElementById('product-popup');
					const c1 = document.getElementById('product-cube-mouse');
					const c2 = document.getElementById('product-cube-klavye');
					const c3 = document.getElementById('product-cube-mousepad');
					if (popup && c1 && c2 && c3 && window.THREE) {
						clearInterval(startInterval);
						populateCubes();
					}
				}, 100);
			})();
		</script>