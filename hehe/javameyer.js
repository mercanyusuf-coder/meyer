
    (function() {
        let productData = [];
        
        // CSV okuma kodu kaldırıldı - Python script ürünleri HTML'e ekliyor
        
        const formatPrice = (price) => {
            const priceNum = typeof price === 'number' ? price : parseFloat(price);
            if (isNaN(priceNum) || priceNum <= 0) return '0 TL';
            const priceInt = Math.floor(priceNum);
            return priceInt.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' TL';
        };
        
        const getDiscountPercent = (oldPrice, newPrice) => {
            const oldP = parseFloat(oldPrice);
            const newP = parseFloat(newPrice);
            if (isNaN(oldP) || isNaN(newP) || oldP <= newP || oldP === 0) {
                return 0;
            }
            return Math.round(((oldP - newP) / oldP) * 100);
        };
        
        const createDiscountBadge = (product) => {
            const percent = getDiscountPercent(product.oldPrice, product.newPrice);
            if (percent) {
                return `<div class="discount-badge">-%${percent}</div>`;
            }
            return '';
        };
        
        const createDealCardHTML = (product) => {
            return `
                <div class="deal-card pixel-window" data-product-id="${product.id}">
                    <div class="pixel-window__title-bar">
                        <span style="animation: meyer-glitch-anim 3s cubic-bezier(0.25, 0.46, 0.45, 0.94) both infinite;">! FIRSAT !</span>
                        <div class="pixel-window__controls">
                            <span class="pixel-window__control-btn">_</span>
                        </div>
                    </div>
                    <div class="pixel-window__content">
                        ${createDiscountBadge(product)}
                        <img src="${product.image}" alt="${product.name}" class="deal-card__image">
                        <h3 class="deal-card__title">${product.name}</h3>
                        <div class="deal-card__price">
                            <span class="deal-card__old-price">${formatPrice(product.oldPrice)}</span>
                            <span class="deal-card__new-price">${formatPrice(product.newPrice)}</span>
                        </div>
                        <a href="${product.link}" target="_blank" class="btn-pixel btn-pixel--primary" data-product-id="${product.id}" style="margin-top: auto; text-decoration: none; display: inline-block;">İncele</a> 
                    </div>
                </div>
            `;
        };
        
        const populateSections = () => {
            const dealGrid = document.getElementById('deal-of-day-grid');
            // Slider'lara ürün ekleme Python script'i tarafından yapılıyor
            // Bu yüzden JavaScript ile slider'lara ürün eklemiyoruz
            // const mouseSlider = document.getElementById('product-slider-mouse');
            // const keyboardSlider = document.getElementById('product-slider-keyboard');
            // const mousepadSlider = document.getElementById('product-slider-mousepad'); 

            // Sliderlardaki product-card'ları DOM'dan oku ve ilk 3 tanesini seç (rastgele değil)
            // Python script'i sliderları doldurduktan sonra çalışması için biraz bekle
            let retryCount = 0;
            const maxRetries = 10; // Maksimum 10 deneme (5 saniye)
            const populateDealsFromSliders = () => {
                if (!dealGrid) return;
                retryCount++;
                
                // Tüm sliderlardaki product-card'ları topla
                const mouseSlider = document.getElementById('product-slider-mouse');
                const keyboardSlider = document.getElementById('product-slider-keyboard');
                const mousepadSlider = document.getElementById('product-slider-mousepad');
                const gamepadSlider = document.getElementById('product-slider-gamepad');
                
                const allProductCards = [];
                
                [mouseSlider, keyboardSlider, mousepadSlider, gamepadSlider].forEach(slider => {
                    if (slider) {
                        const cards = slider.querySelectorAll('.product-card');
                        cards.forEach((card, index) => {
                            // Varyantlı ürünler için: DOM'da gösterilen bilgileri kullan (zaten ilk varyant gösteriliyor)
                            // Sadece aynı group ID'ye sahip ürünlerin tekrar eklenmesini engellemek için groupId kullanıyoruz
                            
                            let imageEl = card.querySelector('.product-card__image');
                            let titleEl = card.querySelector('.product-card__title');
                            let brandEl = card.querySelector('.product-card__brand');
                            let oldPriceEl = card.querySelector('.product-card__old-price');
                            let newPriceEl = card.querySelector('.product-card__new-price');
                            let linkEl = card.querySelector('.btn-pixel');
                            const productId = card.getAttribute('data-product-id') || card.getAttribute('data-product-group-id');
                            const groupId = card.getAttribute('data-product-group-id');
                            
                            if (imageEl && titleEl && oldPriceEl && newPriceEl && linkEl && productId) {
                                // Fiyatları temizle (Türkçe format: "1.234 TL" -> 1234)
                                const parsePrice = (priceText) => {
                                    // TL, boşluk ve noktaları (binlik ayraçlar) kaldır, sadece rakamları al
                                    const cleaned = priceText.replace(/[^\d]/g, '');
                                    return parseInt(cleaned, 10) || 0;
                                };
                                
                                const oldPrice = parsePrice(oldPriceEl.textContent);
                                const newPrice = parsePrice(newPriceEl.textContent);
                                
                                // Sadece indirimli ürünleri ekle (yeni fiyat eski fiyattan küçük olmalı)
                                if (oldPrice > 0 && newPrice > 0 && newPrice < oldPrice) {
                                    // Aynı group ID'ye sahip ürünleri tekrar ekleme (varyantları birleştir)
                                    const existingIndex = allProductCards.findIndex(p => p.groupId === groupId);
                                    if (existingIndex === -1) {
                                        allProductCards.push({
                                            id: productId,
                                            groupId: groupId || productId,
                                            name: titleEl.textContent.trim(),
                                            brand: brandEl ? brandEl.textContent.trim() : '',
                                            image: imageEl.src,
                                            oldPrice: oldPrice,
                                            newPrice: newPrice,
                                            link: linkEl.href || linkEl.getAttribute('href') || ''
                                        });
                                    }
                                }
                            }
                        });
                    }
                });
                
                // İlk 3 ürünü al (rastgele değil, sırayla)
                if (allProductCards.length > 0) {
                    const selectedDeals = allProductCards.slice(0, Math.min(3, allProductCards.length));
                    
                    // Deal card HTML'lerini oluştur
                    const dealCardsHTML = selectedDeals.map(product => {
                        return createDealCardHTML(product);
                    }).join('');
                    
                    dealGrid.innerHTML = dealCardsHTML;
                } else if (retryCount < maxRetries) {
                    // Eğer henüz ürün yoksa, biraz bekleyip tekrar dene (Python script'i çalışmamış olabilir)
                    setTimeout(populateDealsFromSliders, 500);
                }
                // Eğer maksimum deneme sayısına ulaşıldıysa, bir şey yapma (ürünler yok demektir)
            };
            
            // Hemen çalıştır, eğer ürün yoksa 500ms sonra tekrar dener (maksimum 10 deneme)
            populateDealsFromSliders();
            
            // Varyant seçicileri Python script'i tarafından oluşturulan ürünler için de çalışmalı
            setupVariantSelectors();
        };
        
        const buildVariantHTML = (product) => {
            if (!product.variants || product.variants.length <= 1) return '';
            
            const variantTypes = {};
            product.variants.forEach((variant, index) => {
                if (variant.variantType1) {
                    if (!variantTypes[variant.variantType1]) {
                        variantTypes[variant.variantType1] = new Set();
                    }
                    variantTypes[variant.variantType1].add(variant.variantValue1);
                }
                if (variant.variantType2) {
                    if (!variantTypes[variant.variantType2]) {
                        variantTypes[variant.variantType2] = new Set();
                    }
                    variantTypes[variant.variantType2].add(variant.variantValue2);
                }
                if (variant.variantType3) {
                    if (!variantTypes[variant.variantType3]) {
                        variantTypes[variant.variantType3] = new Set();
                    }
                    variantTypes[variant.variantType3].add(variant.variantValue3);
                }
            });
            
            let variantHTML = '<div class="product-card__variants">';
            
            Object.keys(variantTypes).forEach(variantType => {
                const values = Array.from(variantTypes[variantType]);
                const currentVariant = product.variants[product.selectedVariant || 0];
                let currentValue = '';
                if (currentVariant.variantType1 === variantType) {
                    currentValue = currentVariant.variantValue1 || '';
                } else if (currentVariant.variantType2 === variantType) {
                    currentValue = currentVariant.variantValue2 || '';
                } else if (currentVariant.variantType3 === variantType) {
                    currentValue = currentVariant.variantValue3 || '';
                }
                
                variantHTML += `
                    <div class="variant-selector">
                        <div class="variant-selector__label">${variantType}</div>
                        <div class="variant-options">
                `;
                
                values.forEach(value => {
                    const isSelected = value === currentValue;
                    variantHTML += `
                        <button class="variant-option ${isSelected ? 'selected' : ''}" 
                                data-product-id="${product.id}" 
                                data-variant-type="${variantType}" 
                                data-variant-value="${value}">
                            ${value}
                        </button>
                    `;
                });
                
                variantHTML += `
                        </div>
                    </div>
                `;
            });
            
            variantHTML += '</div>';
            return variantHTML;
        };
        
        const createProductCardHTML = (product) => {
            const currentVariant = product.variants && product.variants.length > 0 
                ? product.variants[product.selectedVariant || 0] 
                : product;
            
            const displayImage = currentVariant.image || product.image;
            const displayOldPrice = currentVariant.oldPrice || product.oldPrice;
            const displayNewPrice = currentVariant.newPrice || product.newPrice;
            const displayLink = currentVariant.link || product.link;
            
            return `
                <div class="product-card pixel-window" data-product-id="${product.id}" data-product-group-id="${product.id}">
                    <div class="pixel-window__title-bar">
                        <span>${product.brand}</span>
                    </div>
                    <div class="pixel-window__content">
                        ${createDiscountBadge({oldPrice: displayOldPrice, newPrice: displayNewPrice})}
                        <div class="product-card__image-wrapper">
                            <img src="${displayImage}" alt="${product.name}" class="product-card__image">
                        </div>
                        <span class="product-card__brand">${product.brand}</span>
                        <h3 class="product-card__title">${product.name}</h3>
                        ${buildVariantHTML(product)}
                        <div class="product-card__price">
                            <span class="product-card__old-price">${formatPrice(displayOldPrice)}</span>
                            <span class="product-card__new-price">${formatPrice(displayNewPrice)}</span>
                        </div>
                        <a href="${displayLink}" target="_blank" class="btn-pixel btn-pixel--primary btn-pixel--full">İncele</a>
                    </div>
                </div>
            `;
        };
        
        const SECRET_PRODUCT_ID = '99999';
        const BREAK_COUNT = 3;
        let currentHammerStrikes = 0;
        let isSecretRevealed = false;

        const openModal = (productId) => {
            const product = productData.find(p => p.id === productId);
            if (!product) return;

            const modal = document.getElementById('product-popup');
            const popupContent = document.getElementById('popup-content');
            const brokenGlassOverlay = document.getElementById('broken-glass-overlay');
            const popupImage = document.getElementById('popup-image');

            if (!modal || !popupContent || !brokenGlassOverlay || !popupImage) return;

            const currentVariant = product.variants && product.variants.length > 0 
                ? product.variants[product.selectedVariant || 0] 
                : product;

            if (product.isSecret) {
                isSecretRevealed = false;
                currentHammerStrikes = 0;
                
                popupContent.classList.add('hidden-content');
                brokenGlassOverlay.classList.remove('hidden');
                popupImage.src = 'https://placehold.co/300x300/F9E2FF/4E245E?text=Gizli+Urun';
                popupImage.alt = "Gizli Ürün";
                popupImage.style.animation = 'none';
                document.getElementById('popup-title-bar').innerText = 'Gizli Ürün';
                 document.getElementById('popup-brand').style.visibility = 'hidden';
                 document.getElementById('popup-title').style.visibility = 'hidden';
                 document.getElementById('popup-old-price').style.visibility = 'hidden';
                 document.getElementById('popup-new-price').style.visibility = 'hidden';
                 document.getElementById('popup-link-details').style.visibility = 'hidden';


            } else {
                popupImage.src = currentVariant.image || product.image;
                popupImage.alt = product.name;
                popupImage.style.opacity = '1'; 
                popupImage.style.animation = 'none';

                brokenGlassOverlay.classList.add('hidden');
                popupContent.classList.remove('hidden-content');
                
                document.getElementById('popup-title-bar').innerText = product.brand;
                document.getElementById('popup-brand').innerText = product.brand;
                document.getElementById('popup-title').innerText = product.name;
                document.getElementById('popup-old-price').innerText = formatPrice(currentVariant.oldPrice || product.oldPrice);
                document.getElementById('popup-new-price').innerText = formatPrice(currentVariant.newPrice || product.newPrice);
                document.getElementById('popup-link-details').href = currentVariant.link || product.link;
                document.getElementById('popup-link-details').innerText = 'İncele';
                
                 document.getElementById('popup-brand').style.visibility = 'visible';
                 document.getElementById('popup-title').style.visibility = 'visible';
                 document.getElementById('popup-old-price').style.visibility = 'visible';
                 document.getElementById('popup-new-price').style.visibility = 'visible';
                 document.getElementById('popup-link-details').style.visibility = 'visible';
            }

            modal.classList.remove('hidden');
        };

        const closeModal = () => {
            const modal = document.getElementById('product-popup');
            const popupContent = document.getElementById('popup-content');
            const brokenGlassOverlay = document.getElementById('broken-glass-overlay');
            const popupImage = document.getElementById('popup-image');
            
            if (modal) modal.classList.add('hidden');

            isSecretRevealed = false;
            currentHammerStrikes = 0;
            
            if (popupContent) {
                popupContent.classList.remove('hidden-content');
                popupContent.style.animation = 'none';
                 document.getElementById('popup-brand').style.visibility = 'visible';
                 document.getElementById('popup-title').style.visibility = 'visible';
                 document.getElementById('popup-old-price').style.visibility = 'visible';
                 document.getElementById('popup-new-price').style.visibility = 'visible';
                 document.getElementById('popup-link-details').style.visibility = 'visible';
            }
            if (popupImage) {
                popupImage.style.animation = 'none';
                popupImage.style.opacity = '1';
            }
            if (brokenGlassOverlay) {
                brokenGlassOverlay.classList.add('hidden');
            }
        };

        const updateProductCardVariant = (groupId, variantType, variantValue) => {
            const card = document.querySelector(`[data-product-group-id="${groupId}"]`);
            if (!card) return;
            
            const variantsDataStr = card.getAttribute('data-variants');
            if (!variantsDataStr) return;
            
            let variantsData;
            try {
                variantsData = JSON.parse(variantsDataStr);
            } catch (e) {
                console.error('Varyant verisi parse edilemedi:', e);
                return;
            }
            
            const variants = variantsData.variants || [];
            const variantTypes = variantsData.variantTypes || {};
            if (variants.length <= 1) return;
            
            // Mevcut seçili varyantları bul (yeni seçilen hariç)
            const selectedValues = {};
            card.querySelectorAll('.variant-option.selected').forEach(btn => {
                if (btn.dataset.variantType !== variantType) {
                    selectedValues[btn.dataset.variantType] = btn.dataset.variantValue;
                }
            });
            
            // Yeni seçilen varyantı ekle
            selectedValues[variantType] = variantValue;
            
            // Uyumsuz varyantları temizle - yeni seçimle uyumsuz olan diğer seçimleri kaldır
            const currentSelectedTypes = Object.keys(selectedValues).filter(type => type !== variantType);
            currentSelectedTypes.forEach(checkType => {
                const isValidCombination = variants.some(v => {
                    if (!v.stock || v.stock <= 0) return false;
                    const match1 = !v.variantType1 || selectedValues[v.variantType1] === v.variantValue1;
                    const match2 = !v.variantType2 || selectedValues[v.variantType2] === v.variantValue2;
                    const match3 = !v.variantType3 || selectedValues[v.variantType3] === v.variantValue3;
                    return match1 && match2 && match3;
                });
                if (!isValidCombination) {
                    delete selectedValues[checkType];
                }
            });
            
            // Otomatik varyant seçimi - sadece bir seçenek kalan varyant tiplerini otomatik seç
            let hasAutoSelection = false;
            let maxIterations = 10;
            let iteration = 0;
            
            while (iteration < maxIterations) {
                iteration++;
                let foundNewSelection = false;
                
                Object.keys(variantTypes).forEach(otherType => {
                    if (selectedValues[otherType]) return;
                    
                    const availableOptions = [];
                    variantTypes[otherType].forEach(optionValue => {
                        const testValues = { ...selectedValues };
                        testValues[otherType] = optionValue;
                        
                        const hasMatch = variants.some(v => {
                            if (!v.stock || v.stock <= 0) return false;
                            const match1 = !v.variantType1 || testValues[v.variantType1] === v.variantValue1;
                            const match2 = !v.variantType2 || testValues[v.variantType2] === v.variantValue2;
                            const match3 = !v.variantType3 || testValues[v.variantType3] === v.variantValue3;
                            return match1 && match2 && match3;
                        });
                        
                        if (hasMatch) {
                            availableOptions.push(optionValue);
                        }
                    });
                    
                    if (availableOptions.length === 1) {
                        selectedValues[otherType] = availableOptions[0];
                        hasAutoSelection = true;
                        foundNewSelection = true;
                    }
                });
                if (!foundNewSelection) break;
            }
            
            // Seçilen kombinasyona uyan varyantı bul (stok kontrolü ile)
            const matchingVariant = variants.find(v => {
                if (!v.stock || v.stock <= 0) return false;
                const match1 = !v.variantType1 || selectedValues[v.variantType1] === v.variantValue1;
                const match2 = !v.variantType2 || selectedValues[v.variantType2] === v.variantValue2;
                const match3 = !v.variantType3 || selectedValues[v.variantType3] === v.variantValue3;
                return match1 && match2 && match3;
            });
            
            if (matchingVariant) {
                // Görseli güncelle
                const image = card.querySelector('.product-card__image');
                if (image && matchingVariant.image) {
                    image.src = matchingVariant.image;
                    image.alt = card.querySelector('.product-card__title')?.textContent || '';
                }
                
                // Fiyatları güncelle
                const oldPrice = card.querySelector('.product-card__old-price');
                const newPrice = card.querySelector('.product-card__new-price');
                if (oldPrice && matchingVariant.oldPrice) {
                    const oldPriceValue = typeof matchingVariant.oldPrice === 'number' ? matchingVariant.oldPrice : parseFloat(matchingVariant.oldPrice);
                    if (!isNaN(oldPriceValue) && oldPriceValue > 0) {
                        oldPrice.textContent = formatPrice(oldPriceValue);
                    }
                }
                if (newPrice && matchingVariant.newPrice) {
                    const newPriceValue = typeof matchingVariant.newPrice === 'number' ? matchingVariant.newPrice : parseFloat(matchingVariant.newPrice);
                    if (!isNaN(newPriceValue) && newPriceValue > 0) {
                        newPrice.textContent = formatPrice(newPriceValue);
                    }
                }
                
                // Linki güncelle
                const link = card.querySelector('.btn-pixel');
                if (link && matchingVariant.link) {
                    link.href = matchingVariant.link;
                }
                
                // İndirim rozetini güncelle
                const discountBadge = card.querySelector('.discount-badge');
                if (discountBadge && matchingVariant.oldPrice && matchingVariant.newPrice) {
                    const oldPriceValue = typeof matchingVariant.oldPrice === 'number' ? matchingVariant.oldPrice : parseFloat(matchingVariant.oldPrice);
                    const newPriceValue = typeof matchingVariant.newPrice === 'number' ? matchingVariant.newPrice : parseFloat(matchingVariant.newPrice);
                    if (!isNaN(oldPriceValue) && !isNaN(newPriceValue) && oldPriceValue > 0 && newPriceValue > 0) {
                        const newBadge = createDiscountBadge({
                            oldPrice: oldPriceValue,
                            newPrice: newPriceValue
                        });
                        if (newBadge) {
                            discountBadge.outerHTML = newBadge;
                        }
                    }
                }
                
                // data-product-id'yi güncelle
                if (matchingVariant.variantId) {
                    card.setAttribute('data-product-id', matchingVariant.variantId);
                }
            }
            
            // BUTON DURUMLARINI GÜNCELLE (matchingVariant olsun ya da olmasın)
            // Önce tüm selected class'larını kaldır
            card.querySelectorAll('.variant-option').forEach(btn => {
                btn.classList.remove('selected');
            });
            
            // Seçili değerlere göre selected class'ını ekle
            card.querySelectorAll('.variant-option').forEach(btn => {
                const btnType = btn.dataset.variantType;
                const btnValue = btn.dataset.variantValue;
                if (selectedValues[btnType] === btnValue) {
                    btn.classList.add('selected');
                }
            });
            
            // Tüm butonların disabled durumunu güncelle
            card.querySelectorAll('.variant-option').forEach(btn => {
                const btnType = btn.dataset.variantType;
                const btnValue = btn.dataset.variantValue;
                
                if (selectedValues[btnType] === btnValue) {
                    btn.classList.remove('disabled');
                    return;
                }
                
                const testValues = { ...selectedValues };
                testValues[btnType] = btnValue;
                
                let hasMatch = variants.some(v => {
                    if (!v.stock || v.stock <= 0) return false;
                    const match1 = !v.variantType1 || testValues[v.variantType1] === v.variantValue1;
                    const match2 = !v.variantType2 || testValues[v.variantType2] === v.variantValue2;
                    const match3 = !v.variantType3 || testValues[v.variantType3] === v.variantValue3;
                    return match1 && match2 && match3;
                });
                
                // Eğer hiç match yoksa, bu butonun kendisi var mı kontrol et (ilk seçim için)
                if (!hasMatch) {
                    hasMatch = variants.some(v => {
                        if (!v.stock || v.stock <= 0) return false;
                        if (v.variantType1 === btnType && v.variantValue1 === btnValue) return true;
                        if (v.variantType2 === btnType && v.variantValue2 === btnValue) return true;
                        if (v.variantType3 === btnType && v.variantValue3 === btnValue) return true;
                        return false;
                    });
                }
                
                if (hasMatch) {
                    btn.classList.remove('disabled');
                } else {
                    btn.classList.add('disabled');
                }
            });
        };
        
        let variantSelectorsInitialized = false;
        
        const updateVariantButtonStates = () => {
            // Sayfa yüklendiğinde mevcut varyant butonlarının disabled durumlarını ayarla
            document.querySelectorAll('[data-variants]').forEach(card => {
                const variantsDataStr = card.getAttribute('data-variants');
                if (!variantsDataStr) return;
                
                try {
                    const variantsData = JSON.parse(variantsDataStr);
                    const variants = variantsData.variants || [];
                    if (variants.length <= 1) {
                        card.querySelectorAll('.variant-option').forEach(btn => {
                            btn.classList.remove('disabled');
                        });
                        return;
                    }
                    
                    // Mevcut seçili değerleri al
                    const selectedValues = {};
                    card.querySelectorAll('.variant-option.selected').forEach(selectedBtn => {
                        const type = selectedBtn.dataset.variantType;
                        const value = selectedBtn.dataset.variantValue;
                        if (type && value) {
                            selectedValues[type] = value;
                        }
                    });
                    
                    // Tüm butonların disabled durumunu ayarla
                    card.querySelectorAll('.variant-option').forEach(btn => {
                        const btnType = btn.dataset.variantType;
                        const btnValue = btn.dataset.variantValue;
                        
                        if (!btnType || !btnValue) return;
                        
                        // Seçili butonlar disabled olmamalı
                        if (btn.classList.contains('selected')) {
                            btn.classList.remove('disabled');
                            return;
                        }
                        
                        // Bu butonun seçilmesi durumunda uyumlu kombinasyon var mı?
                        const testValues = { ...selectedValues };
                        testValues[btnType] = btnValue;
                        
                        let hasMatch = variants.some(v => {
                            if (!v.stock || v.stock <= 0) return false;
                            const match1 = !v.variantType1 || testValues[v.variantType1] === v.variantValue1;
                            const match2 = !v.variantType2 || testValues[v.variantType2] === v.variantValue2;
                            const match3 = !v.variantType3 || testValues[v.variantType3] === v.variantValue3;
                            return match1 && match2 && match3;
                        });
                        
                        // Eğer hiç match yoksa, bu butonun kendisi var mı kontrol et (ilk seçim için)
                        if (!hasMatch) {
                            hasMatch = variants.some(v => {
                                if (!v.stock || v.stock <= 0) return false;
                                if (v.variantType1 === btnType && v.variantValue1 === btnValue) return true;
                                if (v.variantType2 === btnType && v.variantValue2 === btnValue) return true;
                                if (v.variantType3 === btnType && v.variantValue3 === btnValue) return true;
                                return false;
                            });
                        }
                        
                        if (hasMatch) {
                            btn.classList.remove('disabled');
                        } else {
                            btn.classList.add('disabled');
                        }
                    });
                } catch (e) {
                    console.error('Varyant verisi parse edilemedi:', e);
                }
            });
        };
        
        const setupVariantSelectors = () => {
            // Event listener'ı sadece bir kez ekle
            if (!variantSelectorsInitialized) {
                variantSelectorsInitialized = true;
                document.addEventListener('click', (e) => {
                    const button = e.target.closest('.variant-option');
                    if (!button) return;
                    
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Disabled butonlara tıklamayı engelle
                    if (button.classList.contains('disabled')) {
                        return;
                    }
                    
                    const groupId = button.dataset.productGroupId;
                    const variantType = button.dataset.variantType;
                    const variantValue = button.dataset.variantValue;
                    
                    if (groupId && variantType && variantValue) {
                        updateProductCardVariant(groupId, variantType, variantValue);
                    }
                }, true);
            }
            
            // Disabled state'leri güncelle (DOM hazır olması için setTimeout)
            setTimeout(() => {
                updateVariantButtonStates();
            }, 100);
        };

        const startCountdown = () => {
            const countdownDate = new Date('2025-11-30T23:59:59').getTime();
            const countdownFunction = setInterval(() => {
                const now = new Date().getTime();
                const distance = countdownDate - now;
                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                
                const el = (id) => document.getElementById(id);
                if(el('days')) el('days').innerText = String(days).padStart(2, '0');
                if(el('hours')) el('hours').innerText = String(hours).padStart(2, '0');
                if(el('minutes')) el('minutes').innerText = String(minutes).padStart(2, '0');
                if(el('seconds')) el('seconds').innerText = String(seconds).padStart(2, '0');

                if (distance < 0) {
                    clearInterval(countdownFunction);
                    const countdownEl = document.querySelector('.countdown');
                    if (countdownEl) {
                        countdownEl.innerHTML = '<p class="hero__subtitle">Fırsatlar Sona Erdi!</p>';
                    }
                }
            }, 1000);
        };

        const openModalFromDealCard = (card) => {
            // Deal card'dan ürün bilgilerini al
            const modal = document.getElementById('product-popup');
            const popupContent = document.getElementById('popup-content');
            const brokenGlassOverlay = document.getElementById('broken-glass-overlay');
            const popupImage = document.getElementById('popup-image');
            
            if (!modal || !popupContent || !brokenGlassOverlay || !popupImage) return;
            
            const titleEl = card.querySelector('.deal-card__title');
            const imageEl = card.querySelector('.deal-card__image');
            const oldPriceEl = card.querySelector('.deal-card__old-price');
            const newPriceEl = card.querySelector('.deal-card__new-price');
            const buttonEl = card.querySelector('.btn-pixel');
            
            if (!titleEl || !imageEl || !oldPriceEl || !newPriceEl) return;
            
            // Brand bilgisini title'dan çıkar
            const titleText = titleEl.textContent.trim();
            const knownBrands = ['Attack Shark', 'Dream Gamer', 'Scyrox', 'Lamzu', 'VGN', 'ATK', 'Tenta-X', 'D-Glow', 'Madlions', 'VXE', 'E-Yooso', 'Artisan', 'Gamesir'];
            let brand = '';
            for (const knownBrand of knownBrands) {
                if (titleText.includes(knownBrand)) {
                    brand = knownBrand;
                    break;
                }
            }
            // Eğer brand bulunamadıysa, title'ın ilk kelimesini dene
            if (!brand) {
                const titleWords = titleText.split(' ');
                if (titleWords.length > 0) {
                    brand = titleWords[0];
                }
            }
            
            popupImage.src = imageEl.src;
            popupImage.alt = titleText;
            popupImage.style.opacity = '1';
            popupImage.style.animation = 'none';
            
            brokenGlassOverlay.classList.add('hidden');
            popupContent.classList.remove('hidden-content');
            
            document.getElementById('popup-title-bar').innerText = brand || 'Ürün Detayı';
            document.getElementById('popup-brand').innerText = brand || '';
            document.getElementById('popup-title').innerText = titleText;
            document.getElementById('popup-old-price').innerText = oldPriceEl.textContent.trim();
            document.getElementById('popup-new-price').innerText = newPriceEl.textContent.trim();
            
            const linkEl = document.getElementById('popup-link-details');
            if (linkEl && buttonEl) {
                const linkHref = buttonEl.href || buttonEl.getAttribute('href') || '#';
                linkEl.href = linkHref;
                linkEl.innerText = 'İncele';
            }
            
            document.getElementById('popup-brand').style.visibility = brand ? 'visible' : 'hidden';
            document.getElementById('popup-title').style.visibility = 'visible';
            document.getElementById('popup-old-price').style.visibility = 'visible';
            document.getElementById('popup-new-price').style.visibility = 'visible';
            if (linkEl) linkEl.style.visibility = 'visible';
            
            modal.classList.remove('hidden');
        };

        const setupModal = () => {
            const modal = document.getElementById('product-popup');
            const dealGrid = document.getElementById('deal-of-day-grid');
            const closeBtn = document.getElementById('popup-close');
            const brokenGlassOverlay = document.getElementById('broken-glass-overlay');
            const popupContent = document.getElementById('popup-content');
            const popupImage = document.getElementById('popup-image'); 
            
            if (!modal || !dealGrid || !closeBtn || !brokenGlassOverlay || !popupContent || !popupImage) return;

            dealGrid.addEventListener('click', (e) => {
                const card = e.target.closest('.deal-card');
                const button = e.target.closest('.btn-pixel');
                
                // Eğer butona veya card'a tıklandıysa, popup aç
                if (button && button.closest('.deal-card')) {
                    e.preventDefault();
                    e.stopPropagation();
                    openModalFromDealCard(button.closest('.deal-card'));
                } else if (card && !button) {
                    // Card'a tıklandı ama butona değil
                    e.preventDefault();
                    e.stopPropagation();
                    openModalFromDealCard(card);
                }
            });
            
            closeBtn.addEventListener('click', closeModal);
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal();
                }
            });
            
            document.addEventListener('keydown', (e) => {
                if (e.key === "Escape" && !modal.classList.contains('hidden')) {
                    closeModal();
                }
            });

            brokenGlassOverlay.addEventListener('click', (e) => {
                if (isSecretRevealed) return;

                currentHammerStrikes++;

                const hammerEffect = document.createElement('div');
                hammerEffect.classList.add('hammer-effect');
                hammerEffect.style.left = `${e.offsetX - 25}px`; 
                hammerEffect.style.top = `${e.offsetY - 25}px`;
                brokenGlassOverlay.appendChild(hammerEffect);
                
                hammerEffect.addEventListener('animationend', () => {
                    hammerEffect.remove();
                });

                    if (currentHammerStrikes >= BREAK_COUNT) {
                        isSecretRevealed = true;
                        brokenGlassOverlay.classList.add('hidden');
                        popupContent.classList.remove('hidden-content');

                    const secretProduct = productData.find(p => p.id === SECRET_PRODUCT_ID);
                    if (secretProduct) {
                        document.getElementById('popup-title-bar').innerText = secretProduct.brand;
                        popupImage.src = secretProduct.image; 
                        popupImage.alt = secretProduct.name;
                         document.getElementById('popup-brand').innerText = secretProduct.brand;
                         document.getElementById('popup-title').innerText = secretProduct.name;
                         document.getElementById('popup-old-price').innerText = formatPrice(secretProduct.oldPrice);
                         document.getElementById('popup-new-price').innerText = formatPrice(secretProduct.newPrice);
                         document.getElementById('popup-link-details').href = secretProduct.link;
                         document.getElementById('popup-link-details').innerText = 'İncele';

                         document.getElementById('popup-brand').style.visibility = 'visible';
                         document.getElementById('popup-title').style.visibility = 'visible';
                         document.getElementById('popup-old-price').style.visibility = 'visible';
                         document.getElementById('popup-new-price').style.visibility = 'visible';
                         document.getElementById('popup-link-details').style.visibility = 'visible';
                         
                         popupContent.style.animation = 'reveal-product 0.5s ease-out forwards'; 
                    }
                }
            });
        };

        const initializeSlider = (sliderId) => {
            const slider = document.getElementById(sliderId);
            // Python script'i ile eklenen ürünler için slider'ı başlat
            // Eğer slider boşsa da çalışabilir, sadece slider yoksa return
            if (!slider) return;

            const container = slider.closest('.slider-container');
            const scrollbarContainer = container.querySelector('.slider-scrollbar-container');
            const thumb = container.querySelector('.slider-scrollbar-thumb');
            const prevBtn = container.querySelector('.prev-btn');
            const nextBtn = container.querySelector('.next-btn');

            if (!container || !scrollbarContainer || !thumb || !prevBtn || !nextBtn) {
                return;
            }

            let isDown = false;
            let startX;
            let scrollLeft;
            let isThumbDragging = false;
            let thumbDragStartX = 0;
            let thumbDragStartScrollLeft = 0;
            let autoScrollInterval;

            const updateControls = () => {
                requestAnimationFrame(() => {
                    if (slider.scrollWidth === 0 && slider.children.length > 0) {
                        setTimeout(updateControls, 50);
                        return;
                    }
                    const maxScrollLeft = slider.scrollWidth - slider.clientWidth;
                    
                    prevBtn.disabled = slider.scrollLeft < 10;
                    nextBtn.disabled = slider.scrollLeft > maxScrollLeft - 10;

                    if (slider.scrollWidth <= slider.clientWidth) {
                        scrollbarContainer.style.display = 'none';
                    } else {
                        scrollbarContainer.style.display = 'block';
                        const scrollPercentage = maxScrollLeft > 0 ? slider.scrollLeft / maxScrollLeft : 0;
                        const thumbWidth = Math.max(20, (slider.clientWidth / slider.scrollWidth) * scrollbarContainer.clientWidth);
                        const thumbMaxLeft = scrollbarContainer.clientWidth - thumbWidth;
                        
                        thumb.style.width = `${thumbWidth}px`;
                        thumb.style.left = `${scrollPercentage * thumbMaxLeft}px`;
                    }
                });
            };
            
            const getScrollAmount = () => {
                const card = slider.querySelector('.product-card');
                return (card ? card.offsetWidth : 280) + 24;
            };

            prevBtn.addEventListener('click', () => {
                slider.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
            });

            nextBtn.addEventListener('click', () => {
                slider.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
            });

            slider.addEventListener('mousedown', (e) => {
                isDown = true;
                slider.style.cursor = 'grabbing';
                startX = e.pageX - slider.offsetLeft;
                scrollLeft = slider.scrollLeft;
            });
            slider.addEventListener('mouseleave', () => {
                isDown = false;
                slider.style.cursor = 'grab';
            });
            slider.addEventListener('mouseup', () => {
                isDown = false;
                slider.style.cursor = 'grab';
            });
            slider.addEventListener('mousemove', (e) => {
                if (!isDown) return;
                e.preventDefault();
                const x = e.pageX - slider.offsetLeft;
                const walk = (x - startX) * 2; // Sürükleme hızını ayarlayabilirsiniz
                slider.scrollLeft = scrollLeft - walk;
            });

            slider.addEventListener('scroll', updateControls);

            thumb.addEventListener('mousedown', (e) => {
                isThumbDragging = true;
                thumbDragStartX = e.clientX;
                thumbDragStartScrollLeft = slider.scrollLeft;
                thumb.style.cursor = 'grabbing';
                document.body.style.userSelect = 'none';
            });

            document.addEventListener('mousemove', (e) => {
                if (!isThumbDragging) return;
                const deltaX = e.clientX - thumbDragStartX;
                const trackWidth = scrollbarContainer.clientWidth;
                const thumbWidth = thumb.offsetWidth;
                const scrollWidth = slider.scrollWidth || slider.clientWidth;
                const maxSliderScroll = scrollWidth - slider.clientWidth;
                const maxThumbScroll = trackWidth - thumbWidth;
                
                if (maxThumbScroll <= 0 || maxSliderScroll <= 0) return;

                let newScrollLeft = thumbDragStartScrollLeft + (deltaX / maxThumbScroll) * maxSliderScroll;
                slider.scrollLeft = Math.max(0, Math.min(maxSliderScroll, newScrollLeft));
            });

            document.addEventListener('mouseup', () => {
                if (!isThumbDragging) return;
                isThumbDragging = false;
                thumb.style.cursor = 'grab';
                document.body.style.userSelect = '';
            });

            const startAutoScroll = () => {
                if (autoScrollInterval) clearInterval(autoScrollInterval);
                autoScrollInterval = setInterval(() => {
                    const scrollWidth = slider.scrollWidth || slider.clientWidth;
                    const maxScrollLeft = scrollWidth - slider.clientWidth;
                    if (maxScrollLeft <=0) return;

                    if (slider.scrollLeft >= maxScrollLeft - 10) {
                        slider.scrollTo({ left: 0, behavior: 'smooth' });
                    } else {
                        slider.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
                    }
                }, 5000);
            };

            const stopAutoScroll = () => {
                clearInterval(autoScrollInterval);
            };

            container.addEventListener('mouseenter', stopAutoScroll);
            container.addEventListener('mouseleave', startAutoScroll);
            container.addEventListener('touchstart', stopAutoScroll, { passive: true });
            container.addEventListener('touchend', startAutoScroll);

            setTimeout(updateControls, 150); 
            window.addEventListener('resize', updateControls);
            
            startAutoScroll();
        };

        const setupEasterEgg = () => {
            const trigger = document.getElementById('secret-trigger');
            if (trigger) {
                trigger.addEventListener('click', (e) => {
                    e.preventDefault();
                    openModal('99999');
                });
            }
        };
        document.addEventListener('DOMContentLoaded', setupEasterEgg);

        let currentFilters = {
            brand: '',
            category: '',
            priceRange: '',
            sort: 'default'
        };

        const setupFiltering = () => {
            const brandFilter = document.getElementById('brand-filter');
            const categoryFilter = document.getElementById('category-filter');
            const priceFilter = document.getElementById('price-filter');
            const sortFilter = document.getElementById('sort-filter');
            const clearBtn = document.getElementById('clear-filters');

            if (brandFilter) brandFilter.addEventListener('change', (e) => {
                currentFilters.brand = e.target.value;
                applyFilters();
            });

            if (categoryFilter) categoryFilter.addEventListener('change', (e) => {
                currentFilters.category = e.target.value;
                applyFilters();
            });

            if (priceFilter) priceFilter.addEventListener('change', (e) => {
                currentFilters.priceRange = e.target.value;
                applyFilters();
            });

            if (sortFilter) sortFilter.addEventListener('change', (e) => {
                currentFilters.sort = e.target.value;
                applyFilters();
            });

            if (clearBtn) clearBtn.addEventListener('click', () => {
                currentFilters = { brand: '', category: '', priceRange: '', sort: 'default' };
                if (brandFilter) brandFilter.value = '';
                if (categoryFilter) categoryFilter.value = '';
                if (priceFilter) priceFilter.value = '';
                if (sortFilter) sortFilter.value = 'default';
                applyFilters();
            });
        };

        const applyFilters = () => {
            let filteredProducts = productData.filter(p => !p.isDealOfDay || p.isDealOfDay === false);

            if (currentFilters.brand) {
                filteredProducts = filteredProducts.filter(p => p.brand === currentFilters.brand);
            }

            if (currentFilters.priceRange) {
                const [min, max] = currentFilters.priceRange.split('-').map(v => v === '+' ? Infinity : parseInt(v));
                filteredProducts = filteredProducts.filter(p => {
                    const price = parseInt(p.newPrice);
                    return price >= min && (max === Infinity ? true : price <= max);
                });
            }

            switch (currentFilters.sort) {
                case 'price-low':
                    filteredProducts.sort((a, b) => parseInt(a.newPrice) - parseInt(b.newPrice));
                    break;
                case 'price-high':
                    filteredProducts.sort((a, b) => parseInt(b.newPrice) - parseInt(a.newPrice));
                    break;
                case 'discount-high':
                    filteredProducts.sort((a, b) => {
                        const discountA = getDiscountPercent(a.oldPrice, a.newPrice) || 0;
                        const discountB = getDiscountPercent(b.oldPrice, b.newPrice) || 0;
                        return discountB - discountA;
                    });
                    break;
                case 'name':
                    filteredProducts.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
                    break;
                case 'default':
                    break;
            }

            updateSliderWithFilteredProducts('product-slider-mouse', filteredProducts.filter(p => p.category === 'mouse'));
            updateSliderWithFilteredProducts('product-slider-keyboard', filteredProducts.filter(p => p.category === 'keyboard'));
            updateSliderWithFilteredProducts('product-slider-mousepad', filteredProducts.filter(p => p.category === 'mousepad'));
        };

        const updateSliderWithFilteredProducts = (sliderId, products) => {
            const slider = document.getElementById(sliderId);
            if (!slider) return;

            if (products.length === 0) {
                slider.innerHTML = '<div class="no-products">Bu kriterlere uygun ürün bulunamadı.</div>';
                return;
            }

            slider.innerHTML = products.map(createProductCardHTML).join('');
            
            setTimeout(() => {
                initializeSlider(sliderId);
            }, 100);
        };


        const showLoading = () => {
            const loadingOverlay = document.getElementById('loading-overlay');
            if (loadingOverlay) {
                loadingOverlay.classList.add('active');
            }
        };

        const hideLoading = () => {
            const loadingOverlay = document.getElementById('loading-overlay');
            if (loadingOverlay) {
                loadingOverlay.classList.remove('active');
            }
        };

        const setupScrollAnimations = () => {
            const observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            }, observerOptions);

            document.querySelectorAll('.deal-card, .product-card, .section-title').forEach(el => {
                el.classList.add('fade-in');
                observer.observe(el);
            });
        };

        const setupNeonEffects = () => {
            const neonElements = document.querySelectorAll('.hero__title, .section-title');
            neonElements.forEach(el => {
                el.addEventListener('mouseenter', () => {
                    el.classList.add('neon-glow');
                });
                el.addEventListener('mouseleave', () => {
                    el.classList.remove('neon-glow');
                });
            });
        };



        const createParticles = () => {
            const particlesContainer = document.getElementById('particles');
            if (!particlesContainer) return;

            for (let i = 0; i < 50; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.animationDelay = Math.random() * 6 + 's';
                particle.style.animationDuration = (Math.random() * 4 + 6) + 's';
                particlesContainer.appendChild(particle);
            }
        };

        const setupParallaxScrolling = () => {
            const parallaxBg = document.getElementById('parallax-bg');
            if (!parallaxBg) return;

            window.addEventListener('scroll', () => {
                const scrolled = window.pageYOffset;
                const rate = scrolled * -0.5;
                parallaxBg.style.transform = `translateY(${rate}px)`;
            });
        };

        const setupGlitchEffects = () => {
            const glitchElements = document.querySelectorAll('.glitch-text');
            glitchElements.forEach(el => {
                el.addEventListener('mouseenter', () => {
                    el.style.animationDuration = '0.1s';
                });
                el.addEventListener('mouseleave', () => {
                    el.style.animationDuration = '2s';
                });
            });
        };

        const setupMicroInteractions = () => {
            document.querySelectorAll('.btn-pixel').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    const ripple = document.createElement('span');
                    const rect = this.getBoundingClientRect();
                    const size = Math.max(rect.width, rect.height);
                    const x = e.clientX - rect.left - size / 2;
                    const y = e.clientY - rect.top - size / 2;
                    
                    ripple.style.width = ripple.style.height = size + 'px';
                    ripple.style.left = x + 'px';
                    ripple.style.top = y + 'px';
                    ripple.classList.add('ripple');
                    
                    this.appendChild(ripple);
                    
                    setTimeout(() => {
                        ripple.remove();
                    }, 600);
                });
            });

            document.querySelectorAll('.product-card, .deal-card').forEach(card => {
                card.addEventListener('mouseenter', () => {
                    card.classList.add('float');
                });
                card.addEventListener('mouseleave', () => {
                    card.classList.remove('float');
                });
            });
        };

        const setupSkeletonLoading = () => {
            const cards = document.querySelectorAll('.product-card, .deal-card');
            cards.forEach(card => {
                card.classList.add('skeleton');
                setTimeout(() => {
                    card.classList.remove('skeleton');
                }, 1000);
            });
        };

        const setupEnhancedAnimations = () => {
            const observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('fade-in', 'visible');
                        
                        const delay = Array.from(entry.target.parentNode.children).indexOf(entry.target) * 100;
                        entry.target.style.animationDelay = delay + 'ms';
                    }
                });
            }, observerOptions);

            document.querySelectorAll('.product-card, .deal-card, .section-title').forEach(el => {
                el.classList.add('fade-in');
                observer.observe(el);
            });
        };

        const initApp = async () => {
            showLoading();
            
            
            setTimeout(() => {
                populateSections();
                startCountdown();
                setupModal();
                setupEasterEgg();
                setupFiltering();
                setupScrollAnimations();
                setupNeonEffects();
                
                createParticles();
                setupParallaxScrolling();
                setupGlitchEffects();
                
                setupMicroInteractions();
                setupSkeletonLoading();
                setupEnhancedAnimations();
                
                setTimeout(() => {
                    initializeSlider('product-slider-mouse');
                    initializeSlider('product-slider-keyboard');
                    initializeSlider('product-slider-mousepad');
                    // Python script'i ile eklenen ürünler için varyant seçicilerini başlat
                    setupVariantSelectors();
                    hideLoading();
                }, 100);
            }, 500);
        };

        const elementId = 'meyer-gaming-landing';
        const checkInterval = setInterval(() => {
            if (document.getElementById(elementId)) {
                clearInterval(checkInterval);
                initApp();
            }
        }, 100);

    })();