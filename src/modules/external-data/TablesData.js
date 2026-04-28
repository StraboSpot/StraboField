import React, {useEffect, useState} from 'react';
import {Dimensions, FlatList, Pressable, ScrollView, Text, View} from 'react-native';

import {Rows, Table} from 'react-native-reanimated-table';

import externalDataStyles from './externalData.styles';
import {toTitleCase} from '../../shared/helpers';
import {DARKGREY} from '../../shared/styles.constants';
import ClearButton from '../../shared/ui/buttons/ClearButton';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import Loading from '../../shared/ui/Loading';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';

function TablesData({
                      editable,
                      initializeDelete,
                      spot,
                    }) {
  /* Local State */

  const [isTableVisible, setIsTableVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTable, setSelectedTable] = useState({});
  const [tableData, setTableData] = useState([]);

  /* Side Effects */

  useEffect(() => {
    // console.log('UE TablesData [isTableVisible]', isTableVisible);
    !isTableVisible && setSelectedTable({});
  }, [isTableVisible]);

  /* Logic Helpers */

  const closeTable = () => {
    setTableData([]);
    setIsTableVisible(false);
  };

  const getTableData = async () => {
    const numCols = tableData?.[0]?.length;
    const tableDataTrimmed = tableData.reduce((acc, r) => r.length === numCols ? [...acc, r] : acc, []);
    let cellMaxWidths = Array(numCols).fill(0);
    tableDataTrimmed.forEach((r) => {
      r.forEach((c, i) => {
        if (c.length > cellMaxWidths[i]) cellMaxWidths[i] = c.length;
      });
    });
    const cellWidths = cellMaxWidths.map(w => Math.min(w * 20, 150));
    const totalTableWidth = cellWidths.reduce((sum, width) => sum + width, 0);

    return {cellWidths: cellWidths, tableDataTrimmed: tableDataTrimmed, totalTableWidth: totalTableWidth};
  };

  const selectTable = (table) => {
    setSelectedTable(table);
    setTableData([]); // clear old
    setIsTableVisible(true); // open immediately
    setLoading(true);

    setTimeout(() => {
      setTableData(table.data || []);
      setLoading(false);
    }, [0]);
  };

  /* Render Functions */

  const renderTable = async () => {
    const {cellWidths, tableDataTrimmed, totalTableWidth} = await getTableData();
    const tableName = toTitleCase(selectedTable?.name.replace(/[_-]/g, ' '));

    const screenWidth = Dimensions.get('window').width;
    const padding = 32; // 16px padding on each side
    const modalPadding = 20; // Additional modal padding
    const minModalWidth = 400;
    const maxModalWidth = screenWidth * 0.9;

    const requiredWidth = totalTableWidth + padding + modalPadding;
    const dynamicWidth = Math.max(minModalWidth, Math.min(requiredWidth, maxModalWidth));

    const dynamicOverlayStyle = {
      ...externalDataStyles.overlayContainer,
      width: dynamicWidth,
      minWidth: minModalWidth,
    };

    return (
      <ModalWrapper
        closeModal={closeTable}
        headerTitle={loading ? 'Loading Table...' : tableName}
        isVisible={isTableVisible}
        overlayStyleOverride={loading ? externalDataStyles.loadingContainer : dynamicOverlayStyle}
        showActionButton={false}
        showCancelButton={false}
        showCloseButton
      >
        <View style={externalDataStyles.modalContent}>
          {loading ? (
            <Loading isLoading={loading} style={{backgroundColor: 'transparent'}}/>
          ) : (
            <ScrollView horizontal>
              <View>
                <ScrollView>
                  <Table borderStyle={{borderWidth: 1, borderColor: '#ccc'}}>
                    <Rows
                      data={tableDataTrimmed}
                      textStyle={externalDataStyles.cellText}
                      widthArr={cellWidths}
                    />
                  </Table>
                </ScrollView>
              </View>
            </ScrollView>
          )}
        </View>
      </ModalWrapper>
    );
  };

  const renderTableListItem = (table) => {
    return (
      <View>
        <Pressable
          loading={loading}
          onPress={() => selectTable(table)}
          style={({pressed}) => [externalDataStyles.listItem, {backgroundColor: pressed ? '#b4b6b8' : '#fff'}]}
        >
          <Text>{table.name} (.CSV)</Text>
          {editable && (
            <ClearButton
              icon={{
                color: DARKGREY,
                name: 'trash',
                size: 20,
                type: 'font-awesome',
              }}
              onPress={() => initializeDelete('csv', table)}
            />
          )}
        </Pressable>
      </View>
    );
  };

  /* View */

  return (
    <View>
      <FlatList
        ItemSeparatorComponent={FlatListItemSeparator}
        ListEmptyComponent={<ListEmptyText text={'No tables saved'}/>}
        data={spot.properties?.data?.tables}
        keyExtractor={item => item.id}
        listKey={'tables'}
        renderItem={({item}) => renderTableListItem(item)}
      />
      {isTableVisible && renderTable()}
    </View>
  );
}

export default TablesData;
